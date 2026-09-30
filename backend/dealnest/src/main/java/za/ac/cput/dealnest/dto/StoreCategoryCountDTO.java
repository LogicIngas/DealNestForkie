package za.ac.cput.dealnest.dto;

import za.ac.cput.dealnest.domain.StoreCategory;

/**
 * One row of the overview's stores-by-category chart.
 *
 * <p>Produced by a GROUP BY rather than by counting categories in the browser, so the
 * chart costs one row per category instead of one per store.
 */
public class StoreCategoryCountDTO {

    private StoreCategory category;
    private long count;

    public StoreCategoryCountDTO() {
    }

    public StoreCategoryCountDTO(StoreCategory category, long count) {
        this.category = category;
        this.count = count;
    }

    public StoreCategory getCategory() {
        return category;
    }

    public void setCategory(StoreCategory category) {
        this.category = category;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
