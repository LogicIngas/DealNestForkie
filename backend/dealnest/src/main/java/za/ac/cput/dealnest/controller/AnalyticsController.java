package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.service.IAnalyticsService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class AnalyticsController {

    private final IAnalyticsService analyticsService;
    private final IStoreService storeService;

    @Autowired
    public AnalyticsController(IAnalyticsService analyticsService, IStoreService storeService) {
        this.analyticsService = analyticsService;
        this.storeService = storeService;
    }

    @PostMapping("/track")
    public ResponseEntity<Map<String, String>> track(@RequestBody Map<String, String> body) {
        String type = body.get("eventType");
        if (type == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "eventType is required."));
        }
        try {
            analyticsService.recordEvent(
                    AnalyticsEventType.valueOf(type),
                    body.get("userId"),
                    body.get("storeId"),
                    body.get("promotionId")
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unknown eventType: " + type));
        }
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<Map<String, Object>> getStoreAnalytics(@PathVariable String storeId) {
        return proGate(storeId)
                .orElseGet(() -> ResponseEntity.ok(analyticsService.getStoreAnalytics(storeId)));
    }

    @GetMapping("/store/{storeId}/insights")
    public ResponseEntity<Map<String, Object>> getCustomerInsights(@PathVariable String storeId) {
        return proGate(storeId)
                .orElseGet(() -> ResponseEntity.ok(analyticsService.getCustomerInsights(storeId)));
    }

    private java.util.Optional<ResponseEntity<Map<String, Object>>> proGate(String storeId) {
        Store store = storeService.read(storeId);
        if (store == null) {
            return java.util.Optional.of(ResponseEntity.notFound().build());
        }
        if (store.getPlanTier() != StorePlanTier.PRO) {
            return java.util.Optional.of(ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(Map.<String, Object>of(
                            "message", "Upgrade to Pro to unlock analytics and customer insights.",
                            "code", "UPGRADE_REQUIRED"
                    )));
        }
        return java.util.Optional.empty();
    }
}