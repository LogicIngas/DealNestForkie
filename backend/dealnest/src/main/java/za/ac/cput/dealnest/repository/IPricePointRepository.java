package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.PricePoint;

import java.util.List;

public interface IPricePointRepository extends JpaRepository<PricePoint, String> {
    List<PricePoint> findByPromotion_PromotionIDOrderByRecordedAtAsc(String promotionId);
}
