package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Redemption;

import java.util.List;
import java.util.Optional;

public interface IRedemptionRepository extends JpaRepository<Redemption, String> {
    Optional<Redemption> findByCode(String code);
    List<Redemption> findByUser_UserID(String userId);
    boolean existsByCode(String code);
}
