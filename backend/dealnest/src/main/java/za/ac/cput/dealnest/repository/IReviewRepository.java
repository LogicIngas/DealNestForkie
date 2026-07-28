package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Review;
import java.util.List;

public interface IReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByStore_StoreId(String storeId);
}
