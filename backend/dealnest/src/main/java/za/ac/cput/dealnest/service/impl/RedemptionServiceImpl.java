package za.ac.cput.dealnest.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.factory.RedemptionFactory;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.security.SecurityUtil;
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
    private final IUserRepository userRepository;

    public RedemptionServiceImpl(IRedemptionRepository repository,
                                 IAnalyticsService analyticsService,
                                 IUserService userService,
                                 IUserRepository userRepository) {
        this.repository = repository;
        this.analyticsService = analyticsService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Redemption claim(Redemption redemption) {
        // The code and redeemed status are always decided here, never trusted
        // from the client's request body.
        String authenticatedUserId = SecurityUtil.currentUserId();
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to claim this deal.");
        }
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        redemption.setUser(user);

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
        // The voucher is not emailed here on purpose: claiming a deal to look at the
        // code is not a request to be emailed, so the user asks for it explicitly
        // with the "Send to email" button (POST /api/redemption/{id}/email).
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
