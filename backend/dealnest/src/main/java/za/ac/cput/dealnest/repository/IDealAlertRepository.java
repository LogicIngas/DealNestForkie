package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.DealAlert;
import za.ac.cput.dealnest.domain.UserPlanTier;

import java.util.List;

public interface IDealAlertRepository extends JpaRepository<DealAlert, String> {
    List<DealAlert> findByUser_UserID(String userId);

    List<DealAlert> findByActiveTrue();

    // Only alerts owned by currently-active Plus subscribers should fire, so a
    // lapsed subscription silently pauses its owner's alerts until they renew.
    List<DealAlert> findByActiveTrueAndUser_PlanTier(UserPlanTier planTier);
}