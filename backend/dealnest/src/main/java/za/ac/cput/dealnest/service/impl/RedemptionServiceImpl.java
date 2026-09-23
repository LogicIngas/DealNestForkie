package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.factory.RedemptionFactory;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.service.IAnalyticsService;
import za.ac.cput.dealnest.service.IRedemptionService;
import za.ac.cput.dealnest.service.IUserService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RedemptionServiceImpl implements IRedemptionService {

    private final IRedemptionRepository repository;
    private final IAnalyticsService analyticsService;
    private final IUserService userService;

    public RedemptionServiceImpl(IRedemptionRepository repository,
                                 IAnalyticsService analyticsService,
                                 IUserService userService) {
        this.repository = repository;
        this.analyticsService = analyticsService;
        this.userService = userService;
    }

    @Override
    public Redemption claim(Redemption redemption) {
        // The code and redeemed status are always decided here, never trusted
        // from the client's request body.
        String code = RedemptionFactory.generateCode();
        int attempts = 0;
        while (repository.existsByCode(code) && attempts < 5) {
            code = RedemptionFactory.generateCode();
            attempts++;
        }
        redemption.setCode(code);
        redemption.setRedeemed(false);
        Redemption saved = repository.save(redemption);

        String userId = saved.getUser() != null ? saved.getUser().getUserID() : null;
        String promotionId = saved.getPromotion() != null ? saved.getPromotion().getPromotionID() : null;
        analyticsService.recordEvent(AnalyticsEventType.DEAL_CLAIMED, userId, null, promotionId);
        if (userId != null) {
            userService.addPoints(userId, 10);
        }
        return saved;
    }

    @Override
    public Redemption redeem(String code, String storeId) {
        Redemption redemption = repository.findByCode(code).orElse(null);
        if (redemption == null || redemption.getPromotion() == null || redemption.getPromotion().getStore() == null) {
            return null;
        }
        if (!redemption.getPromotion().getStore().getStoreId().equals(storeId)) {
            return null;
        }
        if (Boolean.TRUE.equals(redemption.getRedeemed())) {
            return null;
        }
        redemption.setRedeemed(true);
        redemption.setRedeemedAt(LocalDateTime.now());
        Redemption saved = repository.save(redemption);

        String userId = saved.getUser() != null ? saved.getUser().getUserID() : null;
        String promotionId = saved.getPromotion() != null ? saved.getPromotion().getPromotionID() : null;
        analyticsService.recordEvent(AnalyticsEventType.DEAL_REDEEMED, userId, storeId, promotionId);
        if (userId != null) {
            userService.addPoints(userId, 15);
        }
        return saved;
    }

    @Override
    public List<Redemption> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }
}
