package za.ac.cput.dealnest.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.domain.Subscription;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionStatus;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.ISubscriptionRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.util.PayFastUtil;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

/**
 * Real (sandbox/production) PayFast recurring-billing subscriptions.
 *
 * Flow:
 * <ol>
 *   <li>GET-style checkout: the backend builds a signed PayFast payment form
 *       (subscription_type=1, monthly frequency) pointing at PayFast's hosted
 *       /eng/process page and returns it to the frontend, which submits it.</li>
 *   <li>The customer authorises the recurring billing agreement on PayFast's
 *       page, pays the first amount, and is redirected back to our return_url.</li>
 *   <li>PayFast fires an ITN (webhook) to our notify_url. The backend validates
 *       the MD5 signature plus a server-to-server "VALID" round trip, then sets
 *       the User's plan to PLUS (or Store to PRO) with a one-month renewsAt.</li>
 *   <li>Each subsequent monthly charge sends another ITN, which rolls renewsAt
 *       forward. If the subscription is cancelled (ITN CANCELLED, or expired),
 *       the plan is downgraded back to FREE and Pro perks (featured/promoted)
 *       are stripped.</li>
 * </ol>
 */
@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private static final List<SubscriptionStatus> DUE_STATUSES =
            List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED);

    private final ISubscriptionRepository subscriptionRepository;
    private final IUserRepository userRepository;
    private final IStoreRepository storeRepository;
    private final IPromotionRepository promotionRepository;

    @Value("${payfast.merchant-id:}")
    private String merchantId;

    @Value("${payfast.merchant-key:}")
    private String merchantKey;

    @Value("${payfast.passphrase:}")
    private String passphrase;

    @Value("${payfast.sandbox:true}")
    private boolean sandbox;

    @Value("${payfast.plus-amount:49.00}")
    private String plusAmount;

    @Value("${payfast.pro-amount:199.00}")
    private String proAmount;

    @Value("${payfast.return-url:}")
    private String returnUrl;

    @Value("${payfast.cancel-url:}")
    private String cancelUrl;

    @Value("${payfast.notify-url:}")
    private String notifyUrl;

    public SubscriptionService(ISubscriptionRepository subscriptionRepository,
                               IUserRepository userRepository,
                               IStoreRepository storeRepository,
                               IPromotionRepository promotionRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.promotionRepository = promotionRepository;
    }

    // ---------------------------------------------------------------------------
    // Checkout
    // ---------------------------------------------------------------------------

    /**
     * Builds the signed PayFast form for the signed-in account. Ownership is
     * resolved from the JWT: USER subscriptions apply to the current user, STORE
     * subscriptions to the store that user owns.
     *
     * @return {@code { action, fields }} — the hosted page URL and the hidden form fields.
     */
    public Map<String, Object> checkout(SubscriptionAccountType accountType) {
        Plan plan = resolvePlan(accountType);
        ensureConfigured();

        Subscription local = subscriptionRepository
                .findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(plan.accountId(), plan.accountType())
                .filter(s -> s.getStatus() == SubscriptionStatus.PENDING)
                .orElseGet(() -> new Subscription.Builder().build());
        local.setAccountId(plan.accountId());
        local.setAccountType(plan.accountType());
        local.setPlanKey(plan.planName());
        local.setAmountCents(toCents(plan.amount()));
        local.setCurrency("ZAR");
        local.setStatus(SubscriptionStatus.PENDING);
        local = subscriptionRepository.save(local);

        TreeMap<String, String> fields = new TreeMap<>();
        fields.put("merchant_id", merchantId);
        fields.put("merchant_key", merchantKey);
        fields.put("amount", plan.amount());
        fields.put("item_name", "DealNest " + plan.planName() + " subscription");
        fields.put("item_description", "Monthly " + plan.planName() + " plan for " + plan.accountLabel());
        fields.put("m_payment_id", local.getSubscriptionID());
        fields.put("custom_str1", plan.accountType().name());
        fields.put("custom_str2", plan.accountId());
        fields.put("custom_str3", plan.planName());
        fields.put("return_url", safeUrl(returnUrl, "/profile?payfast=success"));
        fields.put("cancel_url", safeUrl(cancelUrl, "/profile?payfast=cancelled"));
        fields.put("notify_url", safeUrl(notifyUrl, "/api/payfast/itn"));
        fields.put("subscription_type", "1");
        fields.put("recurring_amount", plan.amount());
        fields.put("frequency", "3"); // monthly
        fields.put("cycles", "0");    // indefinite
        fields.put("signature", PayFastUtil.signature(fields, passphrase));

        return Map.of(
                "action", sandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
                "fields", fields);
    }

    // ---------------------------------------------------------------------------
    // ITN (instant transaction notification) — called by PayFast itself
    // ---------------------------------------------------------------------------

    /**
     * Validates and reacts to a PayFast ITN. Returns "OK" when processed so
     * PayFast stops retrying; anything else and PayFast will retry.
     */
    public String handleItn(Map<String, String> params) {
        boolean validSignature = PayFastUtil.validSignature(params, passphrase);
        if (!validSignature) {
            log.warn("PayFast ITN failed signature check");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signature");
        }

        if (!PayFastUtil.validServerConfirmation(params, sandbox)) {
            log.warn("PayFast ITN failed server-to-server validation");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Validation failed");
        }

        String paymentStatus = params.getOrDefault("payment_status", "");
        String token = params.get("token");
        String pfPaymentId = params.get("pf_payment_id");
        String mPaymentId = params.get("m_payment_id");

        Subscription local = findFromItn(params);
        if (local == null) {
            // We don't know this payment (maybe a plan that was never ours) — ack so it isn't retried.
            log.warn("PayFast ITN for unknown m_payment_id={} (token={})", mPaymentId, token);
            return "OK";
        }

        if ("COMPLETE".equals(paymentStatus)) {
            if (token != null && !token.isBlank()) {
                local.setPayfastToken(token);
            }
            if (pfPaymentId != null && !pfPaymentId.isBlank()) {
                local.setPayfastPaymentId(pfPaymentId);
            }
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime base = local.getRenewsAt() != null && local.getRenewsAt().isAfter(now)
                    ? local.getRenewsAt()
                    : now;
            LocalDateTime renewsAt = base.plusDays(30);
            local.setStatus(SubscriptionStatus.ACTIVE);
            if (local.getStartsAt() == null) {
                local.setStartsAt(now);
            }
            local.setRenewsAt(renewsAt);
            local.setCanceledAt(null);
            subscriptionRepository.save(local);
            applyPlan(local, true);
            log.info("Activated {} subscription {} until {}", local.getAccountType(), local.getAccountId(), renewsAt);
        } else if ("CANCELLED".equals(paymentStatus)) {
            downgradeLocal(local);
            log.info("PayFast cancelled {} subscription {}", local.getAccountType(), local.getAccountId());
        } else {
            log.info("Ignoring PayFast ITN with payment_status={}", paymentStatus);
        }
        return "OK";
    }

    private Subscription findFromItn(Map<String, String> params) {
        String mPaymentId = params.get("m_payment_id");
        if (mPaymentId != null && !mPaymentId.isBlank()) {
            return subscriptionRepository.findById(mPaymentId).orElse(null);
        }
        String token = params.get("token");
        if (token != null && !token.isBlank()) {
            Optional<Subscription> byToken = subscriptionRepository.findTopByPayfastToken(token);
            if (byToken.isPresent()) return byToken.get();
        }
        if (params.containsKey("custom_str2") && params.containsKey("custom_str3")) {
            SubscriptionAccountType type;
            try {
                type = SubscriptionAccountType.valueOf(params.get("custom_str1"));
            } catch (Exception ex) {
                return null;
            }
            return subscriptionRepository
                    .findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(params.get("custom_str2"), type)
                    .orElse(null);
        }
        return null;
    }

    // ---------------------------------------------------------------------------
    // Cancellation & status (called by the frontend)
    // ---------------------------------------------------------------------------

    /**
     * Cancels the recurring agreement at the end of the current month (Keeps the
     * plan active until renewsAt, matching how PayFast billing works). The ITN
     * CANCELLED / scheduler is what finally downgrades the account.
     */
    public Map<String, Object> cancel(SubscriptionAccountType accountType) {
        Plan plan = resolvePlan(accountType);

        Subscription local = subscriptionRepository
                .findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(plan.accountId(), plan.accountType())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No subscription found for this account."));

        if (local.getStatus() == SubscriptionStatus.ACTIVE) {
            local.setStatus(SubscriptionStatus.CANCELED);
            local.setCanceledAt(LocalDateTime.now());
            subscriptionRepository.save(local);
        }

        return Map.of(
                "accountType", plan.accountType().name(),
                "canceled", true,
                "planKey", plan.planName(),
                "activeUntil", local.getRenewsAt() != null ? local.getRenewsAt().toString() : null);
    }

    /** Current plan state, used by the frontend to detect when the ITN activated a plan. */
    public Map<String, Object> status(SubscriptionAccountType accountType) {
        Plan plan = resolvePlan(accountType);
        Subscription local = subscriptionRepository
                .findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(plan.accountId(), plan.accountType())
                .orElse(null);

        Object account;
        String planTier;
        LocalDateTime renewsAt = null;
        if (accountType == SubscriptionAccountType.USER) {
            User user = userRepository.findById(plan.accountId()).orElse(null);
            account = user;
            planTier = user != null && user.getPlanTier() != null ? user.getPlanTier().name() : "FREE";
            renewsAt = user != null ? user.getPlanRenewsAt() : null;
        } else {
            Store store = storeRepository.findById(plan.accountId()).orElse(null);
            account = store;
            planTier = store != null && store.getPlanTier() != null ? store.getPlanTier().name() : "FREE";
            renewsAt = store != null ? store.getPlanRenewsAt() : null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", local != null ? local.getStatus().name() : "FREE");
        result.put("planTier", planTier);
        result.put("renewsAt", renewsAt != null ? renewsAt.toString() : null);
        result.put("account", account);
        return result;
    }

    // ---------------------------------------------------------------------------
    // Recurring lifecycle (scheduler — keeps the app honest without webhooks)
    // ---------------------------------------------------------------------------

    public void syncDueSubscriptions() {
        LocalDateTime dueThreshold = LocalDateTime.now();
        List<Subscription> due = subscriptionRepository.findByStatusInAndRenewsAtBefore(DUE_STATUSES, dueThreshold);
        for (Subscription local : due) {
            if (local.getStatus() == SubscriptionStatus.CANCELED) {
                // Cancelled at period end: cut off exactly when the paid month ends.
                downgradeLocal(local);
                continue;
            }
            // ACTIVE: a recurring ITN will typically roll renewsAt forward on the
            // billing date; allow a short grace period so a slightly-late ITN at
            // month end doesn't flap the plan off and on.
            if (local.getRenewsAt() != null
                    && local.getRenewsAt().plus(Duration.ofDays(2)).isBefore(dueThreshold)) {
                downgradeLocal(local);
            }
        }
    }

    private void downgradeLocal(Subscription local) {
        log.info("Downgrading {} subscription for account {} to FREE",
                local.getAccountType(), local.getAccountId());
        applyPlan(local, false);
        local.setStatus(SubscriptionStatus.EXPIRED);
        subscriptionRepository.save(local);
    }

    /**
     * Sets (or clears) the plan tier + renewal date on the account. For stores it
     * also strips featured/promoted perks from their deals, since those are
     * Pro-only.
     */
    private void applyPlan(Subscription local, boolean grant) {
        if (local.getAccountType() == SubscriptionAccountType.USER) {
            User user = userRepository.findById(local.getAccountId()).orElse(null);
            if (user == null) return;
            user.setPlanTier(grant ? UserPlanTier.PLUS : UserPlanTier.FREE);
            user.setPlanRenewsAt(grant ? local.getRenewsAt() : null);
            userRepository.save(user);
            return;
        }
        Store store = storeRepository.findById(local.getAccountId()).orElse(null);
        if (store == null) return;
        store.setPlanTier(grant ? StorePlanTier.PRO : StorePlanTier.FREE);
        store.setPlanRenewsAt(grant ? local.getRenewsAt() : null);
        storeRepository.save(store);

        if (!grant) {
            promotionRepository.findByStore_StoreId(store.getStoreId()).forEach(promotion -> {
                if (Boolean.TRUE.equals(promotion.getFeatured()) || Boolean.TRUE.equals(promotion.getPromoted())) {
                    promotion.setFeatured(false);
                    promotion.setPromoted(false);
                    promotionRepository.save(promotion);
                }
            });
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private record Plan(SubscriptionAccountType accountType, String accountId, String accountLabel,
                        String planName, String amount) {
    }

    private Plan resolvePlan(SubscriptionAccountType accountType) {
        String userId = SecurityUtil.currentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to manage a subscription.");
        }
        if (accountType == SubscriptionAccountType.USER) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
            String label = user.getFirstName() != null ? user.getFirstName() : user.getEmail();
            return new Plan(SubscriptionAccountType.USER, user.getUserID(), label, "PLUS", plusAmount);
        }
        Store store = storeRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No store is linked to this account, so it can't subscribe to Pro."));
        return new Plan(SubscriptionAccountType.STORE, store.getStoreId(),
                store.getStoreName() != null ? store.getStoreName() : store.getStoreId(),
                "PRO", proAmount);
    }

    private void ensureConfigured() {
        if (merchantId == null || merchantId.isBlank() || merchantKey == null || merchantKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payments are not configured on the server yet "
                            + "(PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY are missing).");
        }
        if (notifyUrl == null || notifyUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payments are not configured (PAYFAST_NOTIFY_URL is missing — it must be a public https URL).");
        }
    }

    private static long toCents(String zar) {
        try {
            return new BigDecimal(zar).movePointRight(2).longValueExact();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid configured plan amount: " + zar);
        }
    }

    private String safeUrl(String configured, String fallback) {
        if (configured != null && !configured.isBlank()) return configured;
        return fallback;
    }
}