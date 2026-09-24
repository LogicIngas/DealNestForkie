package za.ac.cput.dealnest.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.service.SubscriptionService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

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
    public ResponseEntity<String> handleItn(HttpServletRequest request) throws IOException {
        // The raw, order-preserving url-encoded body is required because PayFast
        // signs md5<exact posted key=value pairs> + passphrase. A decoded Java
        // Map would scramble order and re-encode values, failing the check.
        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        return ResponseEntity.ok(subscriptionService.handleItn(rawBody));
    }
}