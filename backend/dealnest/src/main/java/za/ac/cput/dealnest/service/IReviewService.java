package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Review;
import java.util.List;

public interface IReviewService extends IService<Review, String> {
    List<Review> findByStoreId(String storeId);
    List<Review> getAll();
}
