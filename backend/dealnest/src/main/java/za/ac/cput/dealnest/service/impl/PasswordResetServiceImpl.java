package za.ac.cput.dealnest.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.cput.dealnest.domain.PasswordResetToken;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IPasswordResetTokenRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.EmailNotificationSender;
import za.ac.cput.dealnest.service.IPasswordResetService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements IPasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);

    private final IUserRepository userRepository;
    private final IPasswordResetTokenRepository tokenRepository;
    private final EmailNotificationSender emailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url:${cors.allowed.origin:http://localhost:5173}}")
    private String frontendUrl;

    public PasswordResetServiceImpl(IUserRepository userRepository, 
                                    IPasswordResetTokenRepository tokenRepository, 
                                    EmailNotificationSender emailSender, 
                                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailSender = emailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public boolean isEmailConfigured() {
        return emailSender != null && emailSender.isConfigured();
    }

    @Override
    @Transactional
    public Optional<String> forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unregistered email: {}", email);
            return Optional.empty();
        }

        User user = userOpt.get();
        tokenRepository.deleteByUser_UserID(user.getUserID());
        
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, LocalDateTime.now().plusHours(1));
        tokenRepository.save(resetToken);
        
        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl : "http://localhost:5173";
        if (baseUrl.contains(",")) {
            baseUrl = baseUrl.split(",")[0].trim();
        }
        String resetLink = baseUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;

        String textMessage = "Hello,\n\n"
                + "We received a request to reset the password for your DealNest account.\n"
                + "Click the link below to set a new password (valid for 1 hour):\n\n"
                + resetLink + "\n\n"
                + "If you did not request this, you can safely ignore this email.\n";

        String htmlMessage = String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "<h2 style=\"color: #0d9488; margin-top: 0;\">DealNest Password Reset</h2>"
                + "<p style=\"color: #334155; font-size: 15px; line-height: 1.5;\">Hello,</p>"
                + "<p style=\"color: #334155; font-size: 15px; line-height: 1.5;\">We received a request to reset your password for your DealNest account. Click the button below to choose a new password:</p>"
                + "<div style=\"margin: 28px 0; text-align: center;\">"
                + "<a href=\"%s\" style=\"background-color: #0d9488; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;\">Reset Password</a>"
                + "</div>"
                + "<p style=\"color: #64748b; font-size: 13px; line-height: 1.5;\">Or copy and paste this link into your browser:<br>"
                + "<a href=\"%s\" style=\"color: #0d9488; word-break: break-all;\">%s</a></p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;\" />"
                + "<p style=\"color: #94a3b8; font-size: 12px; margin-bottom: 0;\">This reset link will expire in 1 hour. If you did not request a password reset, no action is needed.</p>"
                + "</div>",
                resetLink, resetLink, resetLink
        );

        if (isEmailConfigured()) {
            try {
                emailSender.send(email, "Reset your DealNest password", textMessage, htmlMessage, UUID.randomUUID().toString());
                log.info("Sent password reset email to {}", email);
            } catch (Exception ex) {
                log.error("Failed to send password reset email to {}: {}", email, ex.getMessage(), ex);
            }
        } else {
            log.warn("Email service is NOT configured. Generated password reset link for {}: {}", email, resetLink);
        }

        return Optional.of(resetLink);
    }

    @Override
    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isPresent()) {
            PasswordResetToken resetToken = tokenOpt.get();
            if (resetToken.getExpiryDate().isAfter(LocalDateTime.now())) {
                User user = resetToken.getUser();
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                tokenRepository.delete(resetToken);
                return true;
            }
        }
        return false;
    }
}
