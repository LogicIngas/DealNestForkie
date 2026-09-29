package za.ac.cput.dealnest.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.security.JwtUtil;
import za.ac.cput.dealnest.service.IUserService;
import za.ac.cput.dealnest.service.IPasswordResetService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Value("${cors.allowed.origin:http://localhost:5173}")
    private String corsOrigin;

    private final IUserService userService;
    private final JwtUtil jwtUtil;
    private final IPasswordResetService passwordResetService;

    @Autowired
    public UserController(IUserService userService, JwtUtil jwtUtil, IPasswordResetService passwordResetService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/create")
    public User create(@RequestBody User user) {
            return userService.create(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User credentials) {
        return userService.login(credentials.getEmail(), credentials.getPassword())
                .<ResponseEntity<?>>map(user -> {
                    String token = jwtUtil.generateUserToken(user.getUserID(), user.getEmail());
                    return ResponseEntity.ok(Map.of("token", token, "user", user));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Incorrect email or password.")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        Optional<String> resetLinkOpt = Optional.empty();
        if (email != null && !email.isBlank()) {
            try {
                resetLinkOpt = passwordResetService.forgotPassword(email.trim());
            } catch (Exception ex) {
                log.error("Error processing forgot-password for email {}: {}", email, ex.getMessage(), ex);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        boolean isLocal = corsOrigin != null && (corsOrigin.contains("localhost") || corsOrigin.contains("127.0.0.1"));

        if (!passwordResetService.isEmailConfigured()) {
            if (isLocal && resetLinkOpt.isPresent()) {
                response.put("message", "Email service is not configured in local environment. Use the link below to set your new password:");
                response.put("devResetUrl", resetLinkOpt.get());
            } else {
                log.warn("Password reset requested for '{}', but email service is not configured! Configure BREVO_API_KEY and BREVO_FROM_EMAIL or SMTP in environment variables to deliver emails.", email);
                response.put("message", "If an account with that email exists, a password reset link has been sent to your email.");
            }
        } else {
            // Always return success to prevent email enumeration
            response.put("message", "If an account with that email exists, a password reset link has been sent to your email.");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid request or password too short."));
        }
        boolean success = passwordResetService.resetPassword(token, newPassword);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Password successfully reset."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired token."));
        }
    }

    @GetMapping("/read/{userId}")
    public User read(@PathVariable String userId) {
        return userService.read(userId);
    }

    @PutMapping("/update/{userId}")
    public User update(@PathVariable String userId, @RequestBody User user) {
        user.setUserID(userId);
        return userService.update(user);
    }

    @DeleteMapping("/delete/{userId}")
    public boolean delete(@PathVariable String userId) {
        return userService.delete(userId);
    }

    @GetMapping("/findByEmail/{email}")
    public Optional<User> findByEmail(@PathVariable String email) {
        return userService.findByEmail(email);
    }

    @GetMapping("/existsByEmail/{email}")
    public boolean existsByEmail(@PathVariable String email) {
        return userService.existsByEmail(email);
    }

    @GetMapping("/getAll")
    public List<User> getAll() {
        return userService.getAll();
    }
}
