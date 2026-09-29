package za.ac.cput.dealnest.service.impl;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SmtpEmailNotificationSenderTest {

    private JavaMailSender mailSender;
    private ObjectProvider<JavaMailSender> provider;
    private SmtpEmailNotificationSender sender;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mailSender);

        sender = new SmtpEmailNotificationSender(provider);
    }

    @Test
    void isNotConfiguredWithoutCredentials() {
        ReflectionTestUtils.setField(sender, "host", "");
        ReflectionTestUtils.setField(sender, "username", "");
        ReflectionTestUtils.setField(sender, "password", "");
        ReflectionTestUtils.setField(sender, "from", "");
        assertThat(sender.isConfigured()).isFalse();

        ReflectionTestUtils.setField(sender, "host", "smtp.gmail.com");
        assertThat(sender.isConfigured()).isFalse();

        ReflectionTestUtils.setField(sender, "username", "dealnest@gmail.com");
        ReflectionTestUtils.setField(sender, "from", "dealnest@gmail.com");
        assertThat(sender.isConfigured()).isFalse();

        ReflectionTestUtils.setField(sender, "password", "app-password");
        assertThat(sender.isConfigured()).isTrue();
    }

    @Test
    void sendsEmailUsingJavaMailSender() {
        ReflectionTestUtils.setField(sender, "host", "smtp.gmail.com");
        ReflectionTestUtils.setField(sender, "username", "dealnest@gmail.com");
        ReflectionTestUtils.setField(sender, "password", "app-password");
        ReflectionTestUtils.setField(sender, "from", "dealnest@gmail.com");
        ReflectionTestUtils.setField(sender, "fromName", "DealNest");

        sender.send("recipient@gmail.com", "Password Reset", "Click link", "<p>Click link</p>", "key-123");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void skipsSendingWhenNotConfigured() {
        ReflectionTestUtils.setField(sender, "host", "");
        sender.send("recipient@gmail.com", "Password Reset", "Click link", "key-123");
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
