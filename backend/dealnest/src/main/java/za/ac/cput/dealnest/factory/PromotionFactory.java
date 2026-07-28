package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.util.Helper;
import java.time.LocalDateTime;

public class PromotionFactory {

    public static Promotion createPromotion(String title, String description, Double originalPrice, 
                                            Double discountPrice, Double discountPercentage,
                                            LocalDateTime startDate, LocalDateTime endDate, 
                                            Boolean isActive, Store store) {
        if (Helper.isNullOrEmpty(title) || originalPrice == null || discountPrice == null ||
            startDate == null || endDate == null || store == null ||
            !Helper.isValidPrice(originalPrice) || !Helper.isValidDiscount(originalPrice, discountPrice) ||
            !Helper.isValidPromotionPeriod(startDate, endDate)) {
            return null;
        }

        return new Promotion.Builder()
                .setTitle(title)
                .setDescription(description)
                .setOriginalPrice(originalPrice)
                .setDiscountPrice(discountPrice)
                .setDiscountPercentage(discountPercentage)
                .setStartDate(startDate)
                .setEndDate(endDate)
                .setActive(isActive)
                .setStore(store)
                .build();
    }
}
