package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.PricePoint;
import za.ac.cput.dealnest.dto.PricePointDTO;

import java.util.List;

public interface IPricePointRepository extends JpaRepository<PricePoint, String> {

    /**
     * Price history for every deal of one store, oldest first within each deal.
     *
     * <p>Exists so a store page can draw a sparkline under each of its deals. It used to
     * ask for that one deal at a time, once per deal, so a store with a dozen deals cost
     * a dozen round trips before the page could finish drawing.
     *
     * <p>This selects the three columns the sparkline reads straight into a DTO. No
     * entity is hydrated and no lazy association is touched, so it is one statement and
     * no follow-up queries. Ordered by recorded_at, and served by
     * idx_price_points_promotion.
     */
    @Query("select new za.ac.cput.dealnest.dto.PricePointDTO(p.promotionID, pp.price, pp.recordedAt) "
            + "from PricePoint pp join pp.promotion p "
            + "where p.store.storeId = :storeId "
            + "order by p.promotionID, pp.recordedAt asc")
    List<PricePointDTO> findHistoryForStore(@Param("storeId") String storeId);

    /** The same projection for a single deal, oldest first. */
    @Query("select new za.ac.cput.dealnest.dto.PricePointDTO(p.promotionID, pp.price, pp.recordedAt) "
            + "from PricePoint pp join pp.promotion p "
            + "where p.promotionID = :promotionId "
            + "order by pp.recordedAt asc")
    List<PricePointDTO> findHistoryForPromotion(@Param("promotionId") String promotionId);
}
