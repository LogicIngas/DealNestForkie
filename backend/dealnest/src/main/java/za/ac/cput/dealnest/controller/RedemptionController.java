package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.service.IRedemptionService;
import za.ac.cput.dealnest.service.impl.VoucherNotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/redemption")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class RedemptionController {

    private final IRedemptionService redemptionService;
    private final VoucherNotificationService voucherNotificationService;

    public RedemptionController(IRedemptionService redemptionService,
                                VoucherNotificationService voucherNotificationService) {
        this.redemptionService = redemptionService;
        this.voucherNotificationService = voucherNotificationService;
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claim(@RequestBody Redemption redemption) {
        Redemption result = redemptionService.claim(redemption);
        if (result == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Could not claim this deal."));
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Emails one of the caller's own vouchers to the email on their account.
     *
     * <p>Takes no recipient in the body on purpose: the address always comes from
     * the server-side user record, so this cannot be used to send mail to someone
     * else. Authenticated via the JWT on /api/redemption/**.
     */
    @PostMapping("/{redemptionId}/email")
    public ResponseEntity<?> emailVoucher(@PathVariable String redemptionId) {
        VoucherNotificationService.Outcome outcome = voucherNotificationService.sendVoucherEmail(redemptionId);

        return switch (outcome.status()) {
            case SENT -> ResponseEntity.ok(Map.of(
                    "message", "Voucher emailed to you.",
                    "status", outcome.status().name()));
            case RATE_LIMITED -> ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "message", "You already emailed this code recently. Try again in "
                            + outcome.retryAfterMinutes() + " minute"
                            + (outcome.retryAfterMinutes() == 1 ? "." : "s."),
                    "status", outcome.status().name(),
                    "retryAfterMinutes", outcome.retryAfterMinutes()));
            case NO_EMAIL_ADDRESS -> ResponseEntity.badRequest().body(Map.of(
                    "message", "Add an email address to your profile first.",
                    "status", outcome.status().name()));
            case NOT_CONFIGURED -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "Email is not set up on the server right now.",
                    "status", outcome.status().name()));
            case FAILED -> ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "message", "The email provider rejected that send. Please try again.",
                    "status", outcome.status().name()));
            // "No such voucher" and "someone else's voucher" are reported identically
            // so the endpoint cannot be used to probe for valid ids.
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", "Voucher not found.",
                    "status", outcome.status().name()));
        };
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
