package za.ac.cput.dealnest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // See IAdminService.getStats(). The report total is inherited; the pending
    // count is the one the overview shows and it is a filtered count.
    //
    // Counted by the database it reads a narrow index range. It was previously
    // arrived at by loading every report with all four of its joins attached and
    // filtering the list in the browser.

    @Query("select count(r) from DealReport r where r.status = :status")
    long countByStatus(@Param("status") DealReportStatus status);

    /**
     * One page of the admin console's report list, with the chain the cards render.
     *
     * <p>Same fetches as {@link #REPORT_FETCH} — the reporting user, the reported
     * promotion, its store and that store's owner, since the card prints the deal title
     * and the store name. Stopped at the page size rather than returning every report.
     *
     * <p>Ordered newest first, which is what the browser was doing with a sort before it
     * sliced. {@code reportID} is the tiebreaker: createdAt is nullable and a timestamp
     * is not unique, so without it two calls could disagree about the last row of a page
     * and show a report twice while skipping another.
     *
     * <p>The count is declared. Derived, it would be built by editing the select clause of
     * a four-join fetch query and counting reports needs none of those joins.
     */
    @Query(value = "select r from DealReport r" + REPORT_FETCH
            + " order by r.createdAt desc nulls last, r.reportID asc",
            countQuery = "select count(r) from DealReport r")
    Page<DealReport> findAllForAdmin(Pageable pageable);
}
