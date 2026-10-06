package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.IStoreService;
import za.ac.cput.dealnest.service.IRecommendationService;
import za.ac.cput.dealnest.service.IAnalyticsService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class StoreController {

    /**
     * Ceiling on how many stores one request may carry.
     *
     * <p>Package-private so the controller test asserts against the same number rather
     * than repeating it, matching {@link PromotionController#MAX_PAGE_SIZE}.
     */
    static final int MAX_PAGE_SIZE = 100;

    private final IStoreService storeService;
    private final IRecommendationService recommendationService;
    private final IAnalyticsService analyticsService;
    private final IUserRepository userRepository;
    private final IStoreRepository storeRepository;

    @Autowired
    public StoreController(IStoreService storeService,
                           IRecommendationService recommendationService,
                           IAnalyticsService analyticsService,
                           IUserRepository userRepository,
                           IStoreRepository storeRepository) {
        this.storeService = storeService;
        this.recommendationService = recommendationService;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
    }

    @PostMapping
    public Store createStore(@RequestBody Store store) {
        requireStoreAccess(store.getUser());
        return storeService.create(store);
    }

    @GetMapping("/{id}")
    public Store getStoreById(@PathVariable String id) {
        analyticsService.recordEvent(AnalyticsEventType.STORE_VIEW, null, id, null);
        return storeService.read(id);
    }

    @GetMapping("/findByUserId/{userId}")
    public ResponseEntity<Store> findByUserId(@PathVariable String userId) {
        return storeService.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Store updateStore(@PathVariable String id, @RequestBody Store store) {
        Store existing = storeService.read(id);
        if (existing == null) return null;
        requireStoreAccess(existing.getUser());
        // Never let the caller reassign ownership of a store.
        store.setUser(existing.getUser());
        return storeService.update(store);
    }

    @DeleteMapping("/{id}")
    public void deleteStore(@PathVariable String id) {
        Store existing = storeService.read(id);
        if (existing == null) return;
        requireStoreAccess(existing.getUser());
        storeService.delete(id);
    }

    /**
     * Admin-only: toggle verified / active flags on a store.
     *
     * <p>This is a surgical PATCH that touches only the two boolean columns the admin
     * console controls. It never goes through the general update path, so there is no
     * risk of email-uniqueness violations, cascade conflicts, or accidental field
     * overwrites from a stale client-side copy of the store.
     */
    @PatchMapping("/{id}/moderate")
    public ResponseEntity<?> moderateStore(@PathVariable String id,
                                           @RequestBody Map<String, Object> flags) {
        if (!SecurityUtil.isAdmin()) {
            throw new AccessDeniedException("Admin access required.");
        }
        Store store = storeRepository.findById(id).orElse(null);
        if (store == null) {
            return ResponseEntity.notFound().build();
        }
        if (flags.containsKey("verified")) {
            store.setVerified(Boolean.parseBoolean(String.valueOf(flags.get("verified"))));
        }
        if (flags.containsKey("active")) {
            store.setActive(Boolean.parseBoolean(String.valueOf(flags.get("active"))));
        }
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok(saved);
    }

    private void requireStoreAccess(User owner) {
        if (SecurityUtil.isAdmin()) return;
        if (owner == null || !owner.getUserID().equals(SecurityUtil.currentUserId())) {
            throw new AccessDeniedException("You don't have permission to manage this store.");
        }
    }

    @GetMapping
    public List<Store> getAllStores() {
        return storeService.getAll();
    }

    /**
     * Active stores, highest rated first, capped at {@code limit}.
     *
     * <p>Separate from {@code /api/stores} rather than a parameter on it, because the two
     * callers want different things and {@link #getAllStores()} is public API that
     * Explore already depends on for the whole directory.
     *
     * <p>{@code limit} defaults to the six the home page draws. That page used to fetch
     * the entire store table and keep six rows of it in the browser, so it got slower
     * with every store added even though it never showed more than six. The limit is
     * clamped for the same reason the deal feed's is: without a ceiling,
     * {@code ?limit=2000000000} is the send-everything request this parameter exists to
     * prevent.
     */
    @GetMapping("/active")
    public List<Store> getActiveStores(@RequestParam(defaultValue = "6") int limit) {
        return storeService.findActive(limit <= 0 ? MAX_PAGE_SIZE : Math.clamp(limit, 1, MAX_PAGE_SIZE));
    }

    /**
     * Ranked store recommendations, best first.
     *
     * <p>{@code limit} stops how much of the ranking is returned, not which stores are
     * scored: {@link za.ac.cput.dealnest.service.impl.RecommendationServiceImpl} still
     * reads and ranks every active store, and only the completed list is truncated. So the
     * top of the response is identical to the uncapped one — only the tail the home page
     * never drew stops being serialised, sent, and turned into DOM nodes.
     *
     * <p>It is a separate request per user (two or three of them are in flight on every
     * home-page load), and each one used to carry the whole ranked directory, which is
     * what made that page the slowest in the app.
     */
    @GetMapping("/recommended/{userId}")
    public List<Store> getRecommended(@PathVariable String userId,
                                      @RequestParam(required = false) Integer limit) {
        return capRecommendation(recommendationService.getRecommendedForUser(userId), limit);
    }

    @GetMapping("/personalized/{userId}")
    public ResponseEntity<?> getPersonalized(@PathVariable String userId,
                                             @RequestParam(required = false) Integer limit) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (user.getPlanTier() != UserPlanTier.PLUS) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "message", "Upgrade to DealNest Plus for personalized recommendations.",
                    "code", "UPGRADE_REQUIRED"));
        }
        return ResponseEntity.ok(capRecommendation(recommendationService.getPersonalizedForUser(userId), limit));
    }

    /**
     * Truncates a completed ranking. An absent limit returns the list untouched, so a
     * caller that predates the parameter keeps the whole ranking it used to get; a
     * present one is clamped, so {@code ?limit=2000000000} cannot restore the unbounded
     * response.
     *
     * <p>{@code getSubList} rather than a stream, because the ranking is already a
     * {@code List} and this is a view, not another copy of it.
     */
    private List<Store> capRecommendation(List<Store> ranked, Integer limit) {
        if (limit == null) return ranked;
        int capped = Math.clamp(limit, 1, MAX_PAGE_SIZE);
        return ranked.size() <= capped ? ranked : ranked.subList(0, capped);
    }
}
