package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.SavedPromotion;
import java.util.List;

public interface ISavedPromotionService extends IService<SavedPromotion, String> {
    List<SavedPromotion> findByUserId(String userId);
    List<SavedPromotion> findByPromotionId(String promotionId);
    List<SavedPromotion> getAll();
}
