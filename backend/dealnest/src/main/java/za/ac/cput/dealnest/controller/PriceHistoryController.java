package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.dto.PricePointDTO;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.IPriceTrackingService;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/priceHistory")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PriceHistoryController {

    private final IPriceTrackingService priceTrackingService;
    private final IPromotionService promotionService;
    private final IStoreService storeService;
    private final IUserService userService;

    public PriceHistoryController(IPriceTrackingService priceTrackingService,
                                  IPromotionService promotionService,
                                  IStoreService storeService,
                                  IUserService userService) {
        this.priceTrackingService = priceTrackingService;
        this.promotionService = promotionService;
        this.storeService = storeService;
        this.userService = userService;
    }

    @GetMapping("/findByPromotionId/{promotionId}")
    public ResponseEntity<?> findByPromotionId(@PathVariable String promotionId) {
        Promotion promotion = promotionService.read(promotionId);
        if (!canViewPriceHistory(promotion)) {
            return upgradeRequired();
        }
        List<PricePointDTO> history = priceTrackingService.findByPromotionId(promotionId);
        return ResponseEntity.ok(history);
    }

    /**
     * Every deal's history for one store, keyed by promotionID.
     *
     * <p>A store page draws a sparkline under each of its deals. It used to call the
     * single-deal endpoint above once per deal, in a loop, so the page could not finish
     * until a request per card had come back. One request now covers the whole store.
     *
     * <p>The Plus gate is unchanged, just decided once for the store instead of once per
     * deal: the owner of this store, an admin, or an active Plus subscriber sees the
     * history, and anyone else gets the same 402 the per-deal endpoint returns.
     */
    @GetMapping("/findByStore/{storeId}")
    public ResponseEntity<?> findByStore(@PathVariable String storeId) {
        if (!canViewStorePriceHistory(storeId)) {
            return upgradeRequired();
        }
        return ResponseEntity.ok(priceTrackingService.findByStoreId(storeId));
    }

    private ResponseEntity<?> upgradeRequired() {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                "message", "Price history is a DealNest Plus perk.",
                "code", "UPGRADE_REQUIRED"));
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
        return isPlusSubscriber();
    }

    private boolean canViewStorePriceHistory(String storeId) {
        if (SecurityUtil.isAdmin()) return true;
        Store store = storeService.read(storeId);
        if (store != null && store.getUser() != null
                && store.getUser().getUserID().equals(SecurityUtil.currentUserId())) {
            return true;
        }
        return isPlusSubscriber();
    }

    private boolean isPlusSubscriber() {
        String userId = SecurityUtil.currentUserId();
        if (userId == null) return false;
        User user = userService.read(userId);
        return user != null && user.getPlanTier() == UserPlanTier.PLUS;
    }
}