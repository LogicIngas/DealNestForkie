package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import za.ac.cput.dealnest.domain.PasswordResetToken;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IPasswordResetTokenRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PasswordResetServiceImplTest {

    private IUserRepository userRepository;
    private IPasswordResetTokenRepository tokenRepository;
    private EmailNotificationSender emailSender;
    private PasswordEncoder passwordEncoder;
    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        userRepository = mock(IUserRepository.class);
        tokenRepository = mock(IPasswordResetTokenRepository.class);
        emailSender = mock(EmailNotificationSender.class);
        passwordEncoder = mock(PasswordEncoder.class);

        service = new PasswordResetServiceImpl(userRepository, tokenRepository, emailSender, passwordEncoder);
    }

    @Test
    void forgotPassword_whenEmailConfigured_sendsEmailToRecipient() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setEmail("user@gmail.com")
                .setFirstName("John")
                .setLastName("Doe")
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(emailSender.isConfigured()).thenReturn(true);

        Optional<String> result = service.forgotPassword("user@gmail.com");

        assertThat(result).isPresent();
        assertThat(result.get()).contains("/reset-password?token=");

        verify(tokenRepository, times(1)).deleteByUser_UserID("user-1");
        verify(tokenRepository, times(1)).save(any(PasswordResetToken.class));
        verify(emailSender, times(1)).send(
                eq("user@gmail.com"),
                eq("Reset your DealNest password"),
                any(String.class),
                any(String.class),
                any(String.class)
        );
    }

    @Test
    void forgotPassword_whenEmailNotConfigured_generatesResetLinkWithoutSending() {
        User user = new User.Builder()
                .setUserID("user-2")
                .setEmail("user@outlook.com")
                .setFirstName("Jane")
                .setLastName("Doe")
                .build();

        when(userRepository.findByEmail("user@outlook.com")).thenReturn(Optional.of(user));
        when(emailSender.isConfigured()).thenReturn(false);

        Optional<String> result = service.forgotPassword("user@outlook.com");

        assertThat(result).isPresent();
        assertThat(result.get()).contains("/reset-password?token=");

        verify(tokenRepository, times(1)).deleteByUser_UserID("user-2");
        verify(tokenRepository, times(1)).save(any(PasswordResetToken.class));
        verify(emailSender, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void resetPassword_withValidToken_updatesPasswordAndDeletesToken() {
        User user = new User.Builder()
                .setUserID("user-3")
                .setPassword("oldHash")
                .setFirstName("Bob")
                .setLastName("Smith")
                .build();

        PasswordResetToken token = new PasswordResetToken("token-123", user, LocalDateTime.now().plusHours(1));
        when(tokenRepository.findByToken("token-123")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newSecretPass")).thenReturn("newHash");

        boolean success = service.resetPassword("token-123", "newSecretPass");

        assertThat(success).isTrue();
        assertThat(user.getPassword()).isEqualTo("newHash");
        verify(userRepository, times(1)).save(user);
        verify(tokenRepository, times(1)).delete(token);
    }
}
