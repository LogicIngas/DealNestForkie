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
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;
import za.ac.cput.dealnest.domain.SubscriptionStatus;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.ISubscriptionRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.security.SecurityUtil;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Plan subscriptions and the lifecycle around them.
 *
 * <p>The plan tier itself lives on the User/Store rows — that is what the plus and
 * pro feature gates read — while this service owns the subscription record, the
 * renewal dates, and the side effects of a plan lapsing.
 *
 * <p>A payment is confirmed through {@link CardPaymentService}, which validates the
 * card and stands in for the authorisation step. Nothing here contacts a payment
 * network, so no real card is charged. A subscription bought this way lapses when
 * its renewal date passes: there is nothing that could re-charge it, and pretending
 * otherwise would mean inventing a payment this system cannot actually make.
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

    @Value("${subscription.plus-amount:49.00}")
    private String plusAmount;

    @Value("${subscription.pro-amount:199.00}")
    private String proAmount;

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
    // Cancellation & status (called by the frontend)
    // ---------------------------------------------------------------------------

    /**
     * Cancels the plan at the end of the period already paid for, so the customer
     * keeps what they paid for. The scheduler downgrades the account once
     * {@code renewsAt} passes.
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

    /** Current plan state, used by the frontend to see which plan is active and until when. */
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

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", local != null ? local.getStatus().name() : "FREE");
        result.put("planTier", planTier);
        result.put("paymentMethod", local != null && local.getPaymentMethod() != null
                ? local.getPaymentMethod().name() : null);
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
            // month end doesn't flap the plan off and on. A one-off EFT pass gets
            // no grace — no further ITN is coming, so the paid 30 days is all there is.
            if (local.getPaymentMethod() == SubscriptionPaymentMethod.EFT) {
                if (local.getRenewsAt() != null && local.getRenewsAt().isBefore(dueThreshold)) {
                    downgradeLocal(local);
                }
                continue;
            }
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

    /**
     * What this account owes, in cents, for the plan it is on. Resolved from the
     * plan rather than accepted from a caller, so the amount authorised is always
     * the amount owed.
     */
    public long planAmountCents(SubscriptionAccountType accountType) {
        return toCents(resolvePlan(accountType).amount());
    }

    /**
     * Grants a plan for a payment confirmed by the built-in card path, applying
     * exactly the same 30 days and the same {@link #applyPlan} side effects as any
     * other confirmed payment.
     *
     * <p>The renewal scheduler downgrades a subscription once {@code renewsAt} has
     * passed, so a plan bought this way lapses on its own. Nothing re-charges it:
     * taking money again would need a card network, and pretending otherwise would
     * mean inventing a payment this system cannot actually make.
     *
     * @param cardBrand  scheme name, kept for the receipt; never the number
     * @param cardLast4  last four digits, kept for the receipt; never the number
     * @param reference  the authorisation reference, so a payment can be traced
     * @return the subscription state, for the caller to return to the client
     */
    public Map<String, Object> grantSimulatedPlan(SubscriptionAccountType accountType,
                                                  SubscriptionPaymentMethod paymentMethod,
                                                  String cardBrand, String cardLast4,
                                                  String reference) {
        Plan plan = resolvePlan(accountType);

        Subscription local = subscriptionRepository
                .findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(plan.accountId(), plan.accountType())
                .filter(s -> s.getStatus() == SubscriptionStatus.PENDING)
                .orElseGet(() -> new Subscription.Builder().build());
        local.setAccountId(plan.accountId());
        local.setAccountType(plan.accountType());
        local.setPlanKey(plan.planName());
        local.setPaymentMethod(paymentMethod);
        local.setAmountCents(toCents(plan.amount()));
        local.setCurrency("ZAR");
        local.setCardBrand(cardBrand);
        local.setCardLast4(cardLast4);
        local.setPaymentReference(reference);

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
        log.info("Activated {} subscription {} until {} on payment reference {} ({} ***{})",
                local.getAccountType(), local.getAccountId(), renewsAt, reference, cardBrand, cardLast4);

        return status(accountType);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private record Plan(SubscriptionAccountType accountType, String accountId, String accountLabel,
                        String planName, String amount, String firstName, String lastName,
                        String email, String cellNumber) {
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
            return new Plan(SubscriptionAccountType.USER, user.getUserID(), label, "PLUS", plusAmount,
                    orEmpty(user.getFirstName()), orEmpty(user.getLastName()),
                    orEmpty(user.getEmail()), orEmpty(user.getPhoneNumber()));
        }
        Store store = storeRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No store is linked to this account, so it can't subscribe to Pro."));
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        return new Plan(SubscriptionAccountType.STORE, store.getStoreId(),
                store.getStoreName() != null ? store.getStoreName() : store.getStoreId(),
                "PRO", proAmount,
                orEmpty(owner.getFirstName()), orEmpty(owner.getLastName()),
                orEmpty(owner.getEmail()), orEmpty(owner.getPhoneNumber()));
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    /** "49.00" to 4900. Exact, so a mistyped plan price fails loudly on startup. */
    private static long toCents(String zar) {
        try {
            return new BigDecimal(zar).movePointRight(2).longValueExact();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Invalid configured plan amount: " + zar);
        }
    }

}
