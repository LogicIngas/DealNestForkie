package za.ac.cput.dealnest.controller;

import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.service.ISavedPromotionService;

import java.util.List;

@RestController
@RequestMapping("/api/savedPromotion")
@CrossOrigin(origins = "http://localhost:3000")
public class SavedPromotionController {

    private final ISavedPromotionService savedPromotionService;

    public SavedPromotionController(ISavedPromotionService savedPromotionService) {
        this.savedPromotionService = savedPromotionService;
    }

    @PostMapping("/create")
    public SavedPromotion create(@RequestBody SavedPromotion savedPromotion) {
        return savedPromotionService.create(savedPromotion);
    }

    @GetMapping("/read/{savedPromotionId}")
    public SavedPromotion read(@PathVariable String savedPromotionId) {
        return savedPromotionService.read(savedPromotionId);
    }

    @PutMapping("/update/savedPromotionId")
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

    @DeleteMapping("/getall")
    public List<SavedPromotion> getAll() {
        return savedPromotionService.getAll();
    }
}
