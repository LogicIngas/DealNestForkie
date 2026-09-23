package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.DealAlert;

import java.util.List;

public interface IDealAlertRepository extends JpaRepository<DealAlert, String> {
    List<DealAlert> findByUser_UserID(String userId);

    List<DealAlert> findByActiveTrue();
}