package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.util.Helper;

public class ReviewFactory {

    public static Review createReview(Integer rating, String comment, Store store) {
        if (rating == null || store == null ||
            !Helper.isValidRating(rating)) {
            return null;
        }

        return new Review.Builder()
                .setRating(rating)
                .setComment(comment)
                .setStore(store)
                .build();
    }
}
