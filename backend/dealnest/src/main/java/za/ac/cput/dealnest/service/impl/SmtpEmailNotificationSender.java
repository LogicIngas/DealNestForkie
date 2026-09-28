package za.ac.cput.dealnest.service.impl;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.util.Properties;

@Component
@ConditionalOnProperty(name = "notifications.email.provider", havingValue = "smtp")
public class SmtpEmailNotificationSender implements EmailNotificationSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailNotificationSender.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${notifications.smtp.from:${spring.mail.username:}}")
    private String from;

    @Value("${notifications.smtp.from-name:DealNest}")
    private String fromName;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttlsEnable;

    public SmtpEmailNotificationSender(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public boolean isConfigured() {
        return hasText(host) && hasText(username) && hasText(password) && hasText(from);
    }

    @Override
    public void send(String recipient, String subject, String message, String idempotencyKey) {
        send(recipient, subject, message, null, idempotencyKey);
    }

    @Override
    public void send(String recipient, String subject, String textBody, String htmlBody, String idempotencyKey) {
        if (!isConfigured()) {
            log.warn("SMTP email sender is not configured (host, username, password, or from is missing). Skipping sending email to {}", recipient);
            return;
        }

        try {
            JavaMailSender sender = getMailSender();
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            if (hasText(fromName)) {
                helper.setFrom(from, fromName);
            } else {
                helper.setFrom(from);
            }

            helper.setTo(recipient);
            helper.setSubject(subject);

            if (hasText(htmlBody)) {
                helper.setText(textBody, htmlBody);
            } else {
                helper.setText(textBody, false);
            }

            sender.send(mimeMessage);
            log.info("Email successfully sent via SMTP to {} [Subject: '{}']", recipient, subject);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to {}: {}", recipient, e.getMessage());
            throw new RuntimeException("Failed to send email via SMTP: " + e.getMessage(), e);
        }
    }

    private JavaMailSender getMailSender() {
        JavaMailSender sender = mailSenderProvider != null ? mailSenderProvider.getIfAvailable() : null;
        if (sender != null) {
            return sender;
        }
        JavaMailSenderImpl impl = new JavaMailSenderImpl();
        impl.setHost(host);
        impl.setPort(port);
        impl.setUsername(username);
        impl.setPassword(password);
        Properties props = impl.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnable));
        return impl;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
