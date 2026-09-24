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

    private final IStoreService storeService;
    private final IRecommendationService recommendationService;
    private final IAnalyticsService analyticsService;
    private final IUserRepository userRepository;

    @Autowired
    public StoreController(IStoreService storeService,
                           IRecommendationService recommendationService,
                           IAnalyticsService analyticsService,
                           IUserRepository userRepository) {
        this.storeService = storeService;
        this.recommendationService = recommendationService;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
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

    @GetMapping("/recommended/{userId}")
    public List<Store> getRecommended(@PathVariable String userId) {
        return recommendationService.getRecommendedForUser(userId);
    }

    @GetMapping("/personalized/{userId}")
    public ResponseEntity<?> getPersonalized(@PathVariable String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (user.getPlanTier() != UserPlanTier.PLUS) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "message", "Upgrade to DealNest Plus for personalized recommendations.",
                    "code", "UPGRADE_REQUIRED"));
        }
        return ResponseEntity.ok(recommendationService.getPersonalizedForUser(userId));
    }
}
