package za.ac.cput.dealnest.controller;

import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.PricePoint;
import za.ac.cput.dealnest.service.IPriceTrackingService;

import java.util.List;

@RestController
@RequestMapping("/api/priceHistory")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PriceHistoryController {

    private final IPriceTrackingService priceTrackingService;

    public PriceHistoryController(IPriceTrackingService priceTrackingService) {
        this.priceTrackingService = priceTrackingService;
    }

    @GetMapping("/findByPromotionId/{promotionId}")
    public List<PricePoint> findByPromotionId(@PathVariable String promotionId) {
        return priceTrackingService.findByPromotionId(promotionId);
    }
}
