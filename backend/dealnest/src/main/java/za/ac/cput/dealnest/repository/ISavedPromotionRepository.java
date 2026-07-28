package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.SavedPromotion;
import java.util.List;

public interface ISavedPromotionRepository extends JpaRepository<SavedPromotion, String> {
    List<SavedPromotion> findByUser_UserID(String userID);
    List<SavedPromotion> findByPromotion_PromotionID(String promotionID);
}
