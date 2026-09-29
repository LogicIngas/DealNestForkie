package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.DealAlert;
import za.ac.cput.dealnest.domain.UserPlanTier;

import java.util.List;
import java.util.Optional;

public interface IDealAlertRepository extends JpaRepository<DealAlert, String> {

    /**
     * The watching user comes back attached, since an alert is serialised with it.
     *
     * <p>{@code store} is not joined: {@code DealAlert.matches} only ever reads the
     * alert's own store identifier, and a Hibernate proxy answers its identifier
     * without a query. Joining it here would put an unnecessary join on the two
     * fan-out queries below, which run once per deal created.
     */
    @Query("select a from DealAlert a join fetch a.user where a.user.userID = :userId")
    List<DealAlert> findByUser_UserID(String userId);

    /**
     * Used only to match alerts against a promotion on the server; never serialised, so
     * nothing is joined. Kept as a derived query for the same reason: it is a plain
     * boolean-column lookup served by idx_deal_alerts_active.
     */
    List<DealAlert> findByActiveTrue();

    // Only alerts owned by currently-active Plus subscribers should fire, so a
    // lapsed subscription silently pauses its owner's alerts until they renew.
    List<DealAlert> findByActiveTrueAndUser_PlanTier(UserPlanTier planTier);

    @Query("select a from DealAlert a join fetch a.user where a.alertID = :alertID")
    Optional<DealAlert> findDetailedById(@Param("alertID") String alertID);
}
