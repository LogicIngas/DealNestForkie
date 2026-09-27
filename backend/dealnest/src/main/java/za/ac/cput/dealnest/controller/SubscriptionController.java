package za.ac.cput.dealnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.service.SubscriptionService;

import java.util.Map;

/**
 * Plan state for the signed-in account.
 *
 * <p>Payment itself lives in {@link CardPaymentController}: the card is entered on
 * DealNest's own checkout, validated, and stood in for at the authorisation step.
 * This controller is only about what plan the account is on.
 */
@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * What this account owes for the plan it is on, so the checkout can show the
     * amount before a card is entered. The amount is always resolved server-side.
     */
    @GetMapping("/price")
    public ResponseEntity<?> price(@RequestParam String accountType) {
        long cents = subscriptionService.planAmountCents(parseAccountType(accountType));
        return ResponseEntity.ok(Map.of(
                "accountType", accountType.toUpperCase(),
                "amountCents", cents,
                "currency", "ZAR"));
    }

    /**
     * Current plan state (status, planTier, renewsAt) for the signed-in account.
     */
    @GetMapping("/status")
    public ResponseEntity<?> status(@RequestParam String accountType) {
        return ResponseEntity.ok(subscriptionService.status(parseAccountType(accountType)));
    }

    /** Cancels at the end of the period already paid for. */
    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(subscriptionService.cancel(accountType(body)));
    }

    private SubscriptionAccountType accountType(Map<String, String> body) {
        return parseAccountType(body == null ? null : body.get("accountType"));
    }

    private SubscriptionAccountType parseAccountType(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("accountType (USER or STORE) is required.");
        }
        try {
            return SubscriptionAccountType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown accountType: " + raw);
        }
    }
}