package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.dto.PricePointDTO;

import java.util.List;
import java.util.Map;

public interface IPriceTrackingService {
    void recordIfChanged(Double previousPrice, Promotion updated);

    /** One deal's history, oldest first. */
    List<PricePointDTO> findByPromotionId(String promotionId);

    /**
     * Price history for all of a store's deals at once, keyed by promotionID.
     *
     * <p>Grouping by deal is the caller's job in the response shape, so it is done here
     * rather than by the caller looping over a flat list.
     */
    Map<String, List<PricePointDTO>> findByStoreId(String storeId);
}
