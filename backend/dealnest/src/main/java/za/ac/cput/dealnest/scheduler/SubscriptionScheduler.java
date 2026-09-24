package za.ac.cput.dealnest.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import za.ac.cput.dealnest.service.SubscriptionService;

/**
 * Keeps paid plans honest without depending on webhook uptime:
 * every 30 minutes it re-syncs ACTIVE/CANCELED subscriptions whose renewal date
 * has passed — downgrading the account back to FREE (plus dropping Pro
 * featured/promoted perks) when the plan lapsed or was cancelled at period end.
 * PayFast's recurring billing sends an ITN each month which rolls renewsAt
 * forward before the scheduler ever cuts the plan off.
 */
@Component
public class SubscriptionScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionScheduler.class);

    private final SubscriptionService subscriptionService;

    public SubscriptionScheduler(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Scheduled(fixedDelay = 1_800_000, initialDelay = 120_000)
    public void syncDueSubscriptions() {
        try {
            subscriptionService.syncDueSubscriptions();
        } catch (Exception ex) {
            // Never let a billing sync failure crash the app.
            log.error("Subscription sync failed: {}", ex.getMessage(), ex);
        }
    }
}