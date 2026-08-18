package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.service.IRedemptionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/redemption")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class RedemptionController {

    private final IRedemptionService redemptionService;

    public RedemptionController(IRedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claim(@RequestBody Redemption redemption) {
        Redemption result = redemptionService.claim(redemption);
        if (result == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Could not claim this deal."));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/redeem")
    public ResponseEntity<?> redeem(@RequestBody Map<String, String> body) {
        Redemption result = redemptionService.redeem(body.get("code"), body.get("storeId"));
        if (result == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Invalid, already-redeemed, or not your store's code."));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/findByUserId/{userId}")
    public List<Redemption> findByUserId(@PathVariable String userId) {
        return redemptionService.findByUserId(userId);
    }
}
