package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.ISavedPromotionRepository;
import za.ac.cput.dealnest.service.ISavedPromotionService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;

@Service
public class SavedPromotionServiceImpl implements ISavedPromotionService {

    // Free-tier users can save up to this many deals; DealNest Plus removes the cap.
    private static final int FREE_SAVED_DEALS_LIMIT = 10;

    private final ISavedPromotionRepository repository;
    private final IUserService userService;

    public SavedPromotionServiceImpl(ISavedPromotionRepository repository, IUserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Override
    public SavedPromotion create(SavedPromotion savedPromotion) {
        if (savedPromotion.getUser() != null) {
            User user = userService.read(savedPromotion.getUser().getUserID());
            if (user != null && user.getPlanTier() != UserPlanTier.PLUS
                    && repository.findByUser_UserID(user.getUserID()).size() >= FREE_SAVED_DEALS_LIMIT) {
                return null;
            }
        }
        return repository.save(savedPromotion);
    }

    @Override
    public SavedPromotion read(String savedPromotionId) {
        return repository.findById(savedPromotionId).orElse(null);
    }

    @Override
    public SavedPromotion update(SavedPromotion savedPromotion) {
        return repository.save(savedPromotion);
    }

    @Override
    public boolean delete(String savedPromotionId) {
        repository.deleteById(savedPromotionId);
        return true;
    }

    @Override
    public List<SavedPromotion> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<SavedPromotion> findByPromotionId(String promotionId) {
        return repository.findByPromotion_PromotionID(promotionId);
    }

    @Override
    public List<SavedPromotion> getAll() {
        return repository.findAll();
    }
}
