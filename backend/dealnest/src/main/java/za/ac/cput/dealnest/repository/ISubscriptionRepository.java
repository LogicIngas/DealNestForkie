package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Subscription;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ISubscriptionRepository extends JpaRepository<Subscription, String> {

    /**
     * The most recent subscription for an account (used to keep the pending record
     * stable across checkout retries and re-checks).
     */
    Optional<Subscription> findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(
            String accountId, SubscriptionAccountType accountType);

    /** Looks a payment up by the reference the authorisation returned. */
    Optional<Subscription> findTopByPaymentReference(String paymentReference);

    List<Subscription> findByStatusInAndRenewsAtBefore(
            List<SubscriptionStatus> statuses, LocalDateTime renewsAt);
}