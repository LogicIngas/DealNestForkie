package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;

import java.util.List;

public interface IDealReportRepository extends JpaRepository<DealReport, String> {
    List<DealReport> findByPromotion_PromotionID(String promotionId);
    List<DealReport> findByStatus(DealReportStatus status);
    boolean existsByPromotion_PromotionIDAndUser_UserID(String promotionId, String userId);
}
