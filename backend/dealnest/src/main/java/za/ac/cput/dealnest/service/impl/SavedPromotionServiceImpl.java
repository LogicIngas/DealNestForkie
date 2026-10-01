package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.ISavedPromotionRepository;
import za.ac.cput.dealnest.service.IAnalyticsService;
import za.ac.cput.dealnest.service.ISavedPromotionService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;

@Service
public class SavedPromotionServiceImpl implements ISavedPromotionService {

    // Free-tier users can save up to this many deals; DealNest Plus removes the cap.
    private static final int FREE_SAVED_DEALS_LIMIT = 10;

    private final ISavedPromotionRepository repository;
    private final IUserService userService;
    private final IAnalyticsService analyticsService;

    public SavedPromotionServiceImpl(ISavedPromotionRepository repository, IUserService userService, IAnalyticsService analyticsService) {
        this.repository = repository;
        this.userService = userService;
        this.analyticsService = analyticsService;
    }

    @Override
    public SavedPromotion create(SavedPromotion savedPromotion) {
        // A repeat save answers with the row that already exists instead of writing a
        // second one — the same idempotency the favourite store gets, and for the same
        // reason: a duplicate survives an unsave, so the bookmark appears not to clear.
        //
        // This has to run before the cap check below. Re-saving a deal the user already
        // has saved is not a new save, so answering 402 for it would both refuse a no-op
        // and report the cap as the reason the bookmark would not fill.
        String userId = savedPromotion.getUser() != null ? savedPromotion.getUser().getUserID() : null;
        String promotionId = savedPromotion.getPromotion() != null
                ? savedPromotion.getPromotion().getPromotionID() : null;
        if (userId != null && promotionId != null) {
            List<SavedPromotion> existing = repository.findByUserAndPromotion(userId, promotionId);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }

        if (savedPromotion.getUser() != null) {
            User user = userService.read(savedPromotion.getUser().getUserID());
            if (user != null && user.getPlanTier() != UserPlanTier.PLUS
                    && repository.findByUser_UserID(user.getUserID()).size() >= FREE_SAVED_DEALS_LIMIT) {
                return null;
            }
        }
        SavedPromotion saved = repository.save(savedPromotion);
        if (saved.getPromotion() != null) {
            analyticsService.recordEvent(AnalyticsEventType.DEAL_SAVED,
                    saved.getUser() != null ? saved.getUser().getUserID() : null,
                    null,
                    saved.getPromotion().getPromotionID());
            if (saved.getUser() != null) {
                userService.addPoints(saved.getUser().getUserID(), 5);
            }
        }
        return saved;
    }

    @Override
    public SavedPromotion read(String savedPromotionId) {
        return repository.findDetailedById(savedPromotionId).orElse(null);
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
