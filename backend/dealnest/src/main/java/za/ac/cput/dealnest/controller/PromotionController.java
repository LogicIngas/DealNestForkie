package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/promotion")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PromotionController {

    private final IPromotionService promotionService;
    private final IStoreService storeService;

    @Autowired
    public PromotionController(IPromotionService promotionService, IStoreService storeService) {
        this.promotionService = promotionService;
        this.storeService = storeService;
    }

    @PostMapping("/create")
    public Promotion create(@RequestBody Promotion promotion) {
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
        return promotionService.update(promotion);
    }

    @DeleteMapping("/delete/{promotionId}")
    public boolean delete(@PathVariable String promotionId) {
        return promotionService.delete(promotionId);
    }

    @GetMapping("/findByStoreId/{storeId}")
    public List<Promotion> findByStoreId(@PathVariable String storeId) {
        return promotionService.findByStoreId(storeId);
    }

    @GetMapping("/findByIsActiveTrue")
    public List<Promotion> findByIsActiveTrue() {
        return promotionService.findByIsActiveTrue();
    }

    @GetMapping("/getAll")
    public List<Promotion> getAll() {
        return promotionService.getAll();
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
