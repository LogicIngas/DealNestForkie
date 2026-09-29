package za.ac.cput.dealnest.service;

import java.util.Optional;

public interface IPasswordResetService {
    Optional<String> forgotPassword(String email);
    boolean resetPassword(String token, String newPassword);
    boolean isEmailConfigured();
}
