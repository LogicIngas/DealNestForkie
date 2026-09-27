package za.ac.cput.dealnest.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Emails a claimed voucher to its owner on request.
 *
 * <p>Sending is never automatic. Claiming a deal only mints a code; many claims are
 * just a user looking at what a code looks like, and an email per claim would waste
 * the provider's daily quota. The user presses "Send to email" instead, which lands
 * on {@link #sendVoucherEmail(String)}.
 *
 * <p>The recipient is always the email on the claim's own user record. No address is
 * ever read from the request, so this endpoint cannot be turned into a relay for
 * mail to arbitrary third parties.
 */
@Service
public class VoucherNotificationService {

    private static final Logger log = LoggerFactory.getLogger(VoucherNotificationService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final IRedemptionRepository redemptionRepository;
    private final EmailNotificationSender emailSender;

    @Value("${notifications.voucher-claims.enabled:true}")
    private boolean enabled;

    @Value("${notifications.voucher-email.cooldown-minutes:60}")
    private long cooldownMinutes;

    public VoucherNotificationService(IRedemptionRepository redemptionRepository,
                                      EmailNotificationSender emailSender) {
        this.redemptionRepository = redemptionRepository;
        this.emailSender = emailSender;
    }

    public enum Status {
        SENT,
        /** Sent too recently; {@link Outcome#retryAfterMinutes()} says how long to wait. */
        RATE_LIMITED,
        /** No such voucher for this user. Deliberately indistinguishable from "not yours". */
        NOT_FOUND,
        NO_EMAIL_ADDRESS,
        NOT_CONFIGURED,
        FAILED
    }

    public record Outcome(Status status, long retryAfterMinutes) {
        static Outcome of(Status status) {
            return new Outcome(status, 0);
        }
    }

    @Transactional
    public Outcome sendVoucherEmail(String redemptionId) {
        if (!enabled) {
            return Outcome.of(Status.NOT_CONFIGURED);
        }

        String currentUserId = SecurityUtil.currentUserId();
        if (currentUserId == null) {
            return Outcome.of(Status.NOT_FOUND);
        }

        Redemption redemption = redemptionRepository.findDetailedById(redemptionId).orElse(null);
        if (redemption == null || redemption.getUser() == null
                || !currentUserId.equals(redemption.getUser().getUserID())
                || redemption.getPromotion() == null || redemption.getPromotion().getStore() == null) {
            // Same response for "does not exist" and "belongs to someone else" so the
            // endpoint cannot be used to discover other people's voucher ids.
            log.warn("Refused voucher email for redemption {} requested by {}", redemptionId, currentUserId);
            return Outcome.of(Status.NOT_FOUND);
        }

        User user = redemption.getUser();
        if (!hasText(user.getEmail())) {
            return Outcome.of(Status.NO_EMAIL_ADDRESS);
        }

        long waitMinutes = minutesUntilResendAllowed(redemption);
        if (waitMinutes > 0) {
            return new Outcome(Status.RATE_LIMITED, waitMinutes);
        }

        if (!emailSender.isConfigured()) {
            return Outcome.of(Status.NOT_CONFIGURED);
        }

        Promotion promotion = redemption.getPromotion();
        Store store = promotion.getStore();
        String subject = "Your DealNest voucher for " + display(promotion.getTitle(), "this deal");
        String message = buildEmailMessage(redemption, user, promotion, store);

        try {
            emailSender.send(user.getEmail().trim(), subject, message,
                    buildEmailHtml(redemption, user, promotion, store),
                    "voucher-claim:" + redemptionId + ":email");
        } catch (Exception ex) {
            log.warn("Voucher email delivery failed for redemption {}", redemptionId, ex);
            return Outcome.of(Status.FAILED);
        }

        // Stamped only after a successful send, so a provider outage does not lock
        // the user out of their own voucher for the whole cooldown.
        redemption.setEmailedAt(LocalDateTime.now());
        redemptionRepository.save(redemption);
        log.info("Voucher email sent on request for redemption {} to user {}", redemptionId, user.getUserID());
        return Outcome.of(Status.SENT);
    }

    private long minutesUntilResendAllowed(Redemption redemption) {
        if (cooldownMinutes <= 0 || redemption.getEmailedAt() == null) {
            return 0;
        }
        long elapsed = ChronoUnit.MINUTES.between(redemption.getEmailedAt(), LocalDateTime.now());
        long remaining = cooldownMinutes - elapsed;
        return Math.max(remaining, 0);
    }

    private String buildEmailMessage(Redemption redemption, User user, Promotion promotion, Store store) {
        List<String> lines = new ArrayList<>();
        lines.add("Hi " + display(user.getFirstName(), "there") + ",");
        lines.add("");
        lines.add("Your DealNest voucher is ready.");
        lines.add("");
        lines.add("Deal: " + display(promotion.getTitle(), "Untitled deal"));
        lines.add("Code: " + display(redemption.getCode(), "Unavailable"));
        lines.add("Store: " + display(store.getStoreName(), "DealNest store"));
        lines.add("Address: " + storeAddress(store));
        lines.add("Phone: " + display(store.getPhoneNumber(), "Not provided"));
        lines.add("Email: " + display(store.getEmail(), "Not provided"));
        String hours = storeHours(store);
        if (hours != null) {
            lines.add("Hours: " + hours);
        }
        if (promotion.getEndDate() != null) {
            lines.add("Valid until: " + DATE_FORMAT.format(promotion.getEndDate()));
        }
        lines.add("");
        lines.add("Show this code at the store to claim the discount.");
        return String.join("\n", lines);
    }

    /**
     * HTML twin of {@link #buildEmailMessage}, with the code as the visual subject of
     * the email. Sent as the HTML part with the plain text kept alongside it, so
     * clients that do not render HTML still get a readable voucher.
     *
     * <p>Every interpolated value is escaped. Deal titles and store details are
     * editable by store owners, so unescaped they would let an owner inject their
     * own markup into a DealNest-branded email.
     */
    private String buildEmailHtml(Redemption redemption, User user, Promotion promotion, Store store) {
        String hours = storeHours(store);
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html><html><body style=\"margin:0;padding:0;background:#f4f5f7;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f4f5f7;padding:24px 12px;\"><tr><td align=\"center\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"max-width:560px;background:#ffffff;border-radius:10px;")
                .append("font-family:Arial,Helvetica,sans-serif;color:#1f2933;\">");

        html.append("<tr><td style=\"padding:28px 32px 8px;\">")
                .append("<p style=\"margin:0;font-size:15px;\">Hi ")
                .append(escapeHtml(display(user.getFirstName(), "there")))
                .append(",</p>")
                .append("<h1 style=\"margin:12px 0 0;font-size:22px;line-height:1.3;\">")
                .append(escapeHtml(display(promotion.getTitle(), "Untitled deal")))
                .append("</h1>")
                .append("</td></tr>");

        html.append("<tr><td style=\"padding:20px 32px 0;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;\">")
                .append("<tr><td align=\"center\" style=\"padding:20px 16px;\">")
                .append("<p style=\"margin:0 0 8px;font-size:12px;letter-spacing:1.5px;")
                .append("text-transform:uppercase;color:#15803d;\">Your voucher code</p>")
                .append("<p style=\"margin:0;font-family:'Courier New',Courier,monospace;")
                .append("font-size:30px;font-weight:bold;letter-spacing:3px;color:#14532d;\">")
                .append(escapeHtml(display(redemption.getCode(), "Unavailable")))
                .append("</p></td></tr></table></td></tr>");

        html.append("<tr><td style=\"padding:24px 32px 0;font-size:15px;line-height:1.6;\">")
                .append(detailRow("Store", display(store.getStoreName(), "DealNest store")))
                .append(detailRow("Address", storeAddress(store)))
                .append(detailRow("Phone", display(store.getPhoneNumber(), "Not provided")))
                .append(detailRow("Email", display(store.getEmail(), "Not provided")));
        if (hours != null) {
            html.append(detailRow("Hours", hours));
        }
        if (promotion.getEndDate() != null) {
            html.append(detailRow("Valid until", DATE_FORMAT.format(promotion.getEndDate())));
        }
        html.append("</td></tr>");

        html.append("<tr><td style=\"padding:22px 32px 30px;\">")
                .append("<p style=\"margin:0;font-size:15px;\">Show this code at the store ")
                .append("to claim the discount.</p>")
                .append("</td></tr>");

        return html.append("</table></td></tr></table></body></html>").toString();
    }

    private String detailRow(String label, String value) {
        return "<p style=\"margin:0 0 6px;\"><span style=\"color:#616e7c;\">"
                + escapeHtml(label) + ":</span> " + escapeHtml(value) + "</p>";
    }

    /**
     * Escapes the five characters that can break out of HTML text or attribute
     * context. Without this, a store owner could put markup in their store name and
     * have it rendered inside a DealNest email.
     */
    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    /**
     * Returns null when the store has not set both times, so the line is left off
     * entirely rather than telling the customer the hours are unavailable.
     */
    private String storeHours(Store store) {
        LocalTime opening = store.getOpeningTime();
        LocalTime closing = store.getClosingTime();
        if (opening == null || closing == null) {
            return null;
        }
        return TIME_FORMAT.format(opening) + " - " + TIME_FORMAT.format(closing);
    }

    private String storeAddress(Store store) {
        String address = display(store.getAddress(), "Address not provided");
        return hasText(store.getCity()) ? address + ", " + store.getCity().trim() : address;
    }

    private String display(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
