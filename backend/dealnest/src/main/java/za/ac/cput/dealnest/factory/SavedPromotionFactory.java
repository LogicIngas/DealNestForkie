package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.Promotion;

public class SavedPromotionFactory {

    public static SavedPromotion createSavedPromotion(User user, Promotion promotion) {
        if (user == null || promotion == null) {
            return null;
        }

        return new SavedPromotion.Builder()
                .setUser(user)
                .setPromotion(promotion)
                .build();
    }
}
