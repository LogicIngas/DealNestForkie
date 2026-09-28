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

    /**
     * Plain-text twin of {@link #buildEmailHtml}, for the clients that will not
     * render HTML at all. Plain text has no bold, so the code is separated instead:
     * a rule above and below, on its own line, with nothing else competing for it.
     * Without that it arrives as an unremarkable {@code Code: ...} line in a block
     * of similar-looking lines, which is the complaint that prompted the layout work.
     */
    private String buildEmailMessage(Redemption redemption, User user, Promotion promotion, Store store) {
        String code = display(redemption.getCode(), "Unavailable");
        List<String> lines = new ArrayList<>();
        lines.add("Hi " + display(user.getFirstName(), "there") + ",");
        lines.add("");
        lines.add("Your DealNest voucher is ready for:");
        lines.add(display(promotion.getTitle(), "Untitled deal"));
        lines.add("");
        lines.add(repeat('*', 34));
        lines.add("  " + code);
        lines.add(repeat('*', 34));
        lines.add("");
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

    private String repeat(char character, int times) {
        return String.valueOf(character).repeat(times);
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
        String code = display(redemption.getCode(), "Unavailable");
        String expiry = promotion.getEndDate() == null ? null : DATE_FORMAT.format(promotion.getEndDate());
        String address = storeAddress(store);
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html><html><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
                // Stops clients that force dark mode from inverting the white card and
                // the green code panel into something unreadable.
                .append("<meta name=\"color-scheme\" content=\"light\">")
                .append("<meta name=\"supported-color-schemes\" content=\"light\">")
                .append("<title>Your DealNest voucher</title>")
                // Progressive enhancement only: the baseline sizes are inline, so a
                // client that drops this still lays the panel out correctly.
                .append("<style>@media only screen and (max-width:520px){")
                .append(".code{font-size:24px !important;letter-spacing:2px !important;}")
                .append(".pad{padding-left:20px !important;padding-right:20px !important;}}</style>")
                .append("</head>")
                // Preheader: the line an inbox shows beside the subject. The code is
                // deliberately kept out of it, because a voucher is not something to
                // read off a lock screen.
                .append("<body style=\"margin:0;padding:0;background:#f4f5f7;\">")
                .append("<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">")
                .append("Your voucher is ready — show this code in store.")
                .append("</div>")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f4f5f7;padding:24px 12px;\"><tr><td align=\"center\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"max-width:560px;background:#ffffff;border-radius:12px;")
                .append("font-family:Arial,Helvetica,sans-serif;color:#1f2933;\">");

        html.append("<tr><td class=\"pad\" style=\"padding:28px 32px 0;\">")
                .append("<p style=\"margin:0;font-size:15px;line-height:1.5;color:#52606d;\">Hi ")
                .append(escapeHtml(display(user.getFirstName(), "there")))
                .append(", your voucher is ready to use.</p>")
                .append("<h1 style=\"margin:10px 0 0;font-size:22px;line-height:1.3;font-weight:bold;\">")
                .append(escapeHtml(display(promotion.getTitle(), "Untitled deal")))
                .append("</h1>")
                .append("</td></tr>");

        // The code is the one thing the email exists to deliver, so it gets its own
        // panel, a monospace face, and heavy letter spacing: it has to stay readable
        // when someone is reading it aloud at a counter in a queue.
        html.append("<tr><td class=\"pad\" style=\"padding:22px 32px 0;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;\">")
                .append("<tr><td align=\"center\" style=\"padding:22px 16px;\">")
                .append("<p style=\"margin:0 0 10px;font-size:11px;letter-spacing:1.5px;")
                .append("text-transform:uppercase;color:#15803d;\">Your voucher code</p>")
                .append("<p class=\"code\" style=\"margin:0;font-family:'Courier New',Courier,monospace;")
                .append("font-size:30px;font-weight:bold;letter-spacing:3px;color:#14532d;")
                .append("word-break:break-all;\">")
                .append(escapeHtml(code))
                .append("</p></td></tr></table></td></tr>");

        // Pulled out of the details block and given its own line, because an expired
        // voucher is the failure this email most often causes and it was previously
        // the last thing anyone would read.
        if (expiry != null) {
            html.append("<tr><td class=\"pad\" style=\"padding:14px 32px 0;\">")
                    .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                    .append("style=\"background:#fffbeb;border-left:3px solid #f59e0b;border-radius:6px;\">")
                    .append("<tr><td style=\"padding:11px 14px;font-size:14px;line-height:1.5;color:#78350f;\">")
                    .append("<strong style=\"font-weight:bold;\">Use it by ")
                    .append(escapeHtml(expiry))
                    .append("</strong></td></tr></table></td></tr>");
        }

        html.append("<tr><td class=\"pad\" style=\"padding:26px 32px 0;\">")
                .append("<p style=\"margin:0 0 8px;font-size:11px;letter-spacing:1.2px;")
                .append("text-transform:uppercase;color:#7b8794;\">Where to redeem</p>")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"border-collapse:collapse;\">");

        String phone = display(store.getPhoneNumber(), "Not provided");
        String emailAddress = display(store.getEmail(), "Not provided");

        // Collected first so each row knows whether it is the last one and can drop
        // its bottom rule. "Valid until" is deliberately absent: the amber strip above
        // already carries the date, and saying it twice in one email is clutter.
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] { "Store", display(store.getStoreName(), "DealNest store"), null });
        rows.add(new String[] { "Address", address, null });
        rows.add(new String[] { "Phone", phone, telHref(store.getPhoneNumber()) });
        rows.add(new String[] { "Email", emailAddress, mailtoHref(store.getEmail()) });
        if (hours != null) {
            rows.add(new String[] { "Hours", hours, null });
        }
        for (int i = 0; i < rows.size(); i++) {
            String[] row = rows.get(i);
            html.append(detailRow(row[0], row[1], row[2], i == rows.size() - 1));
        }
        html.append("</table></td></tr>");

        html.append("<tr><td class=\"pad\" style=\"padding:22px 32px 0;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f8fafc;border:1px solid #e4e7eb;border-radius:8px;\">")
                .append("<tr><td style=\"padding:14px 16px;font-size:14px;line-height:1.6;color:#52606d;\">")
                .append("Show this code at the counter to claim the discount.")
                .append("</td></tr></table></td></tr>");

        html.append("<tr><td class=\"pad\" style=\"padding:20px 32px 28px;\">")
                .append("<p style=\"margin:0;font-size:12px;line-height:1.5;color:#9aa5b1;\">")
                .append("This voucher was emailed to your DealNest account.")
                .append("</p>")
                .append("</td></tr>");

        return html.append("</table></td></tr></table></body></html>").toString();
    }

    /**
     * One row of the redemption details, laid out as a table row so the labels line up
     * in a column. A run of "Label: value" paragraphs is the hardest part of these
     * emails to scan, because the eye has no edge to follow down the page.
     *
     * <p>{@code href} makes the value tappable, for the two details a customer is
     * likely to act on from their phone. It is null for values with nothing to call
     * or write to.
     */
    private String detailRow(String label, String value, String href, boolean last) {
        String rule = last ? "" : "border-bottom:1px solid #eef1f4;";
        String content = href == null
                ? escapeHtml(value)
                : "<a href=\"" + escapeHtml(href) + "\" style=\"color:#0f766e;text-decoration:none;\">"
                        + escapeHtml(value) + "</a>";
        return "<tr>"
                + "<th align=\"left\" valign=\"top\" style=\"width:104px;padding:9px 16px 9px 0;"
                + "font-size:13px;line-height:1.5;font-weight:normal;color:#7b8794;" + rule + "\">"
                + escapeHtml(label) + "</th>"
                + "<td valign=\"top\" style=\"padding:9px 0;font-size:14px;line-height:1.5;"
                + "color:#1f2933;" + rule + "\">"
                + content
                + "</td></tr>";
    }

    /**
     * A {@code tel:} link for a phone number, or null when there is not a usable
     * number. Spaces and punctuation are stripped so the dialer accepts it, and a
     * value that contains no digits at all is left as plain text rather than becoming
     * a link that cannot do anything.
     */
    private String telHref(String phone) {
        if (!hasText(phone)) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9+]", "");
        return digits.replaceAll("[^0-9]", "").isEmpty() ? null : "tel:" + digits;
    }

    /**
     * A {@code mailto:} link, or null when the store has not set an address.
     * Whitespace is removed because a stray space is the usual reason a mailto link
     * silently fails to open a draft.
     */
    private String mailtoHref(String email) {
        return hasText(email) ? "mailto:" + email.trim().replaceAll("\\s", "") : null;
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
