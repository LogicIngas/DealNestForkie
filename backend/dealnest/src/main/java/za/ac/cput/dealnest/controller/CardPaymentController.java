package za.ac.cput.dealnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;
import za.ac.cput.dealnest.service.CardPaymentService;

import java.util.Map;

/**
 * DealNest's own card path.
 *
 * <p>These endpoints stand in for the step a card network would perform. They
 * validate the details that were typed in and decide an outcome locally, which is
 * what makes them worth having: a hosted gateway's sandbox never sees the card at
 * all, so there is nothing there to check.
 *
 * <p>They do not take money and cannot. Nothing here contacts a payment network, so
 * no real card is ever charged. The whole controller is behind
 * {@code payment.card-simulator.enabled}, which is off in the deployed environment —
 * a store owner cannot enter a card into a live instance and be led to believe they
 * were charged.
 *
 * <p>No endpoint here returns, logs or stores the card number. Responses carry the
 * scheme, the last four digits and a reference.
 */
@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class CardPaymentController {

    private final CardPaymentService cardPaymentService;

    public CardPaymentController(CardPaymentService cardPaymentService) {
        this.cardPaymentService = cardPaymentService;
    }

    /**
     * Checks a card without attempting a payment, returning every rule that was
     * applied and whether it held. Drives the live feedback on the form, and is the
     * endpoint that shows the validation working on its own.
     */
    @PostMapping("/check")
    public ResponseEntity<?> check(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(cardPaymentService.check(
                body.get("cardNumber"), body.get("expiry"), body.get("cvv"), body.get("holderName")));
    }

    /**
     * Attempts an authorisation for an amount. Returns the outcome and a reference
     * whether it was approved or declined, so a caller can show a decline reason
     * rather than a generic failure.
     */
    @PostMapping("/authorise")
    public ResponseEntity<?> authorise(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(cardPaymentService.authorise(
                body.get("cardNumber"), amountCents(body)));
    }

    /**
     * Validates, authorises, and on approval activates the plan — the same 30 days
     * and the same plan side effects any confirmed payment gets.
     *
     * <p>Note there is no amount in the request. The amount is resolved from the plan
     * the account is actually on, so a caller cannot talk the system into a cheaper
     * price by editing a field.
     */
    @PostMapping("/pay")
    public ResponseEntity<?> pay(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(cardPaymentService.pay(
                body.get("cardNumber"), body.get("expiry"), body.get("cvv"), body.get("holderName"),
                accountType(body), paymentMethod(body)));
    }

    private long amountCents(Map<String, String> body) {
        String raw = body.get("amountCents");
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("amountCents is required.");
        }
        try {
            long cents = Long.parseLong(raw.trim());
            if (cents <= 0) {
                throw new IllegalArgumentException("amountCents must be greater than zero.");
            }
            return cents;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("amountCents must be a whole number of cents.");
        }
    }

    private SubscriptionAccountType accountType(Map<String, String> body) {
        String raw = body == null ? null : body.get("accountType");
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("accountType (USER or STORE) is required.");
        }
        try {
            return SubscriptionAccountType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown accountType: " + raw);
        }
    }

    private SubscriptionPaymentMethod paymentMethod(Map<String, String> body) {
        String raw = body == null ? null : body.get("paymentMethod");
        if (raw == null || raw.isBlank()) {
            return SubscriptionPaymentMethod.CARD;
        }
        try {
            return SubscriptionPaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown paymentMethod (expected CARD or EFT): " + raw);
        }
    }
}
