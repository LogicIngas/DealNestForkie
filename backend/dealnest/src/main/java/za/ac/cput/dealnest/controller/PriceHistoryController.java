package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.PricePoint;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.IPriceTrackingService;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/priceHistory")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PriceHistoryController {

    private final IPriceTrackingService priceTrackingService;
    private final IPromotionService promotionService;
    private final IUserService userService;

    public PriceHistoryController(IPriceTrackingService priceTrackingService,
                                  IPromotionService promotionService,
                                  IUserService userService) {
        this.priceTrackingService = priceTrackingService;
        this.promotionService = promotionService;
        this.userService = userService;
    }

    @GetMapping("/findByPromotionId/{promotionId}")
    public ResponseEntity<?> findByPromotionId(@PathVariable String promotionId) {
        Promotion promotion = promotionService.read(promotionId);
        if (!canViewPriceHistory(promotion)) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "message", "Price history is a DealNest Plus perk.",
                    "code", "UPGRADE_REQUIRED"));
        }
        List<PricePoint> history = priceTrackingService.findByPromotionId(promotionId);
        return ResponseEntity.ok(history);
    }

    // Admins and store owners (for their own promotions) always get price history;
    // everyone else must be a currently-active DealNest Plus subscriber.
    private boolean canViewPriceHistory(Promotion promotion) {
        if (SecurityUtil.isAdmin()) return true;
        if (promotion != null && promotion.getStore() != null
                && promotion.getStore().getUser() != null
                && promotion.getStore().getUser().getUserID().equals(SecurityUtil.currentUserId())) {
            return true;
        }
        String userId = SecurityUtil.currentUserId();
        if (userId == null) return false;
        User user = userService.read(userId);
        return user != null && user.getPlanTier() == UserPlanTier.PLUS;
    }
}