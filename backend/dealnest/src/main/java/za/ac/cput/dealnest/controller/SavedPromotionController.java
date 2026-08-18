package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.service.ISavedPromotionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/savedPromotion")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class SavedPromotionController {

    private final ISavedPromotionService savedPromotionService;

    public SavedPromotionController(ISavedPromotionService savedPromotionService) {
        this.savedPromotionService = savedPromotionService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody SavedPromotion savedPromotion) {
        SavedPromotion result = savedPromotionService.create(savedPromotion);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(Map.of("message", "You've reached the free plan's 10 saved deals. Upgrade to DealNest Plus for unlimited saves."));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/read/{savedPromotionId}")
    public SavedPromotion read(@PathVariable String savedPromotionId) {
        return savedPromotionService.read(savedPromotionId);
    }

    @PutMapping("/update/{savedPromotionId}")
    public SavedPromotion update(@PathVariable String savedPromotionId,@RequestBody SavedPromotion savedPromotion) {
        return savedPromotionService.update(savedPromotion);
    }

    @DeleteMapping("/delete/{savedPromotionId}")
    public boolean delete(@PathVariable String savedPromotionId) {
        return savedPromotionService.delete(savedPromotionId);
    }

    @GetMapping("/findByUserId/{userId}")
    public List<SavedPromotion> findByUserId(@PathVariable String userId) {
        return savedPromotionService.findByUserId(userId);
    }

    @GetMapping("/findByPromotionId/{promotionId}")
    public List<SavedPromotion> findByPromotionId(@PathVariable String promotionId) {
        return savedPromotionService.findByPromotionId(promotionId);
    }

    @GetMapping("/getall")
    public List<SavedPromotion> getAll() {
        return savedPromotionService.getAll();
    }
}
