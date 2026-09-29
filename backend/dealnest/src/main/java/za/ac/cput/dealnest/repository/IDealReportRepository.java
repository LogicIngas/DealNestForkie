package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;

import java.util.List;
import java.util.Optional;

public interface IDealReportRepository extends JpaRepository<DealReport, String> {

    /**
     * The whole chain a report is serialised with comes back attached: the reporting
     * user, the reported promotion, that promotion's store, and the store's owner.
     *
     * <p>Unfetched, a list of reports cost four queries per row. Every join is to-one,
     * so the join cannot duplicate rows. Served by idx_deal_reports_promotion.
     */
    String REPORT_FETCH = " join fetch r.user join fetch r.promotion p join fetch p.store s join fetch s.user";

    @Query("select r from DealReport r" + REPORT_FETCH + " where p.promotionID = :promotionId")
    List<DealReport> findByPromotion_PromotionID(String promotionId);

    @Query("select r from DealReport r" + REPORT_FETCH + " where r.status = :status")
    List<DealReport> findByStatus(DealReportStatus status);

    boolean existsByPromotion_PromotionIDAndUser_UserID(String promotionId, String userId);

    @Query("select r from DealReport r" + REPORT_FETCH + " where r.reportID = :reportID")
    Optional<DealReport> findDetailedById(@Param("reportID") String reportID);
}
