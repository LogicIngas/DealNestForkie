package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.service.IPromotionService;

import java.util.List;


@RestController
@RequestMapping("/api/promotion")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class PromotionController {

    private final IPromotionService promotionService;

    @Autowired
    public PromotionController(IPromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @PostMapping("/create")
    public Promotion create(@RequestBody Promotion promotion) {
        return promotionService.create(promotion);
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
}
