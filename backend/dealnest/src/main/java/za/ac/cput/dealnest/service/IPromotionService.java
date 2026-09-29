package za.ac.cput.dealnest.service;

import org.springframework.data.domain.Pageable;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.StoreCategory;
import za.ac.cput.dealnest.dto.PageResponse;
import java.util.List;

public interface IPromotionService extends IService<Promotion, String> {
    List<Promotion> findByStoreId(String storeId);

    /**
     * The active feed, capped at {@code limit} rows.
     *
     * <p>A limit of zero or less means no cap, for the few callers that need every
     * active deal rather than the first few.
     */
    List<Promotion> findByIsActiveTrue(int limit);

    List<Promotion> getAll();

    /** One page of deals matching the filters. */
    PageResponse<Promotion> searchActive(String keyword, Double maxPrice,
                                          StoreCategory category, Pageable pageable);
}
