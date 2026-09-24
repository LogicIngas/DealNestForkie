package za.ac.cput.dealnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.service.SubscriptionService;

import java.util.Map;

/**
 * Receives PayFast ITNs (instant transaction notifications / webhooks) at
 * POST /api/payfast/itn. This endpoint has no JWT (it's public) because PayFast
 * signs every ITN and the subscription service then verifies the signature and
 * confirms the payment server-to-server with /eng/query/validate. It must be
 * publicly reachable, so PayFast's notify URL should point at the deployed
 * Render backend.
 */
@RestController
@RequestMapping("/api/payfast")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class PayFastItnController {

    private final SubscriptionService subscriptionService;

    public PayFastItnController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/itn")
    public ResponseEntity<String> handleItn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(subscriptionService.handleItn(params));
    }
}