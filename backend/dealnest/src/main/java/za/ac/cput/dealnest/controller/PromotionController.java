package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.dto.PageResponse;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/promotion")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PromotionController {

    /**
     * Ceiling on how many deals one request may carry, whether it asks via the feed's
     * {@code limit} or the search's {@code size}.
     *
     * <p>Without it, {@code ?size=100000} puts the paging back to what it replaced.
     * Package-private so the controller test asserts against the same number rather than
     * repeating it.
     */
    static final int MAX_PAGE_SIZE = 100;

    private final IPromotionService promotionService;
    private final IStoreService storeService;

    @Autowired
    public PromotionController(IPromotionService promotionService, IStoreService storeService) {
        this.promotionService = promotionService;
        this.storeService = storeService;
    }

    @PostMapping("/create")
    public Promotion create(@RequestBody Promotion promotion) {
        Store store = null;
        if (promotion.getStore() != null && promotion.getStore().getStoreId() != null) {
            store = storeService.read(promotion.getStore().getStoreId());
            if (store == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Store not found.");
            }
            promotion.setStore(store);
        }
        requireStoreAccess(store);
        return promotionService.create(promotion);
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkCreate(@RequestBody BulkCreateRequest request) {
        if (request.getStoreId() == null || request.getPromotions() == null || request.getPromotions().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "storeId and a non-empty promotions list are required."));
        }

        Store store = storeService.read(request.getStoreId());
        if (store == null) {
            return ResponseEntity.notFound().build();
        }
        requireStoreAccess(store);
        if (store.getPlanTier() != StorePlanTier.PRO) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                    "message", "Upgrade to Pro to use bulk promotion upload.",
                    "code", "UPGRADE_REQUIRED"));
        }

        List<Promotion> created = new ArrayList<>();
        int skipped = 0;
        for (Promotion promotion : request.getPromotions()) {
            promotion.setStore(store);
            try {
                created.add(promotionService.create(promotion));
            } catch (Exception ex) {
                skipped++;
            }
        }
        return ResponseEntity.ok(Map.of(
                "created", created.size(),
                "skipped", skipped,
                "promotions", created));
    }

    @GetMapping("/read/{promotionId}")
    public Promotion read(@PathVariable String promotionId) {
        return promotionService.read(promotionId);
    }

    @PutMapping("/update/{promotionId}")
    public Promotion update(@PathVariable String promotionId,@RequestBody Promotion promotion) {
        Promotion existing = promotionService.read(promotionId);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Promotion not found.");
        }
        requireStoreAccess(existing.getStore());
        // Drive updates from the persisted record so the caller can't reassign
        // the promotion to a different store.
        promotion.setPromotionID(promotionId);
        promotion.setStore(existing.getStore());
        return promotionService.update(promotion);
    }

    @DeleteMapping("/delete/{promotionId}")
    public boolean delete(@PathVariable String promotionId) {
        Promotion existing = promotionService.read(promotionId);
        if (existing == null) return false;
        requireStoreAccess(existing.getStore());
        return promotionService.delete(promotionId);
    }

    @GetMapping("/findByStoreId/{storeId}")
    public List<Promotion> findByStoreId(@PathVariable String storeId) {
        return promotionService.findByStoreId(storeId);
    }

    /**
     * The public deal feed, newest-first with promoted and featured deals on top.
     *
     * <p>{@code limit} caps how many come back, and defaults to the six the home page
     * draws. It used to return the whole active feed and let the browser keep the first
     * six, so the cost of the page scaled with the size of the catalogue rather than
     * with what it shows. Zero or less asks for all of them, which only Explore needs.
     *
     * <p>A positive limit is clamped by {@link #MAX_PAGE_SIZE}, for the same reason
     * {@code /search} clamps its size: otherwise {@code ?limit=2000000000} is the
     * "send me everything" request this parameter exists to stop.
     */
    @GetMapping("/findByIsActiveTrue")
    public List<Promotion> findByIsActiveTrue(@RequestParam(defaultValue = "6") int limit) {
        return promotionService.findByIsActiveTrue(
                limit <= 0 ? 0 : Math.clamp(limit, 1, MAX_PAGE_SIZE));
    }

    /**
     * Deals matching the filters, one page at a time.
     *
     * <p>{@code size} is capped rather than trusted, so a caller asking for every deal
     * in one response does not get it. The response carries {@code last} so the client
     * knows whether to offer a next page without having to reason about how full this
     * one was.
     */
    @GetMapping("/search")
    public PageResponse<Promotion> search(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) Double maxPrice,
                                          @RequestParam(required = false) StoreCategory category,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "24") int size) {
        return promotionService.searchActive(q, maxPrice, category,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE)));
    }

    @GetMapping("/getAll")
    public List<Promotion> getAll() {
        return promotionService.getAll();
    }

    private void requireStoreAccess(Store store) {
        if (SecurityUtil.isAdmin()) return;
        if (store == null || store.getUser() == null
                || !store.getUser().getUserID().equals(SecurityUtil.currentUserId())) {
            throw new AccessDeniedException("You don't have permission to manage this store's promotions.");
        }
    }

    public static class BulkCreateRequest {
        private String storeId;
        private List<Promotion> promotions;

        public String getStoreId() {
            return storeId;
        }

        public void setStoreId(String storeId) {
            this.storeId = storeId;
        }

        public List<Promotion> getPromotions() {
            return promotions;
        }

        public void setPromotions(List<Promotion> promotions) {
            this.promotions = promotions;
        }
    }
}
