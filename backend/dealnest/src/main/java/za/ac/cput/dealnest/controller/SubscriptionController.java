package za.ac.cput.dealnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.service.SubscriptionService;

import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Builds the signed PayFast hosted-page form. Returns
     * {@code { action, fields }} which the frontend submits as a plain HTML form
     * (hidden inputs) to send the customer to PayFast's hosted page.
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(subscriptionService.checkout(accountType(body)));
    }

    /**
     * Current plan state (status, planTier, renewsAt) for the signed-in account.
     * The frontend polls this after a successful PayFast return to detect when
     * the ITN has activated the plan.
     */
    @GetMapping("/status")
    public ResponseEntity<?> status(@RequestParam String accountType) {
        return ResponseEntity.ok(subscriptionService.status(parseAccountType(accountType)));
    }

    /** Cancels at the end of the current paid month (real PayFast behaviour). */
    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(subscriptionService.cancel(accountType(body)));
    }

    private SubscriptionAccountType accountType(Map<String, String> body) {
        String raw = body == null ? null : body.get("accountType");
        return parseAccountType(raw);
    }

    private SubscriptionAccountType parseAccountType(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("accountType (USER or STORE) is required.");
        }
        try {
            return SubscriptionAccountType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown accountType: " + raw);
        }
    }
}