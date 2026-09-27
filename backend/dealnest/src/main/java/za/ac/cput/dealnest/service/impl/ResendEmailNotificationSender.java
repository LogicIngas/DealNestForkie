package za.ac.cput.dealnest.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "notifications.email.provider", havingValue = "resend")
public class ResendEmailNotificationSender implements EmailNotificationSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailNotificationSender.class);

    private final RestClient client;

    @Value("${notifications.resend.api-key:}")
    private String apiKey;

    @Value("${notifications.resend.from:}")
    private String from;

    public ResendEmailNotificationSender(
            @Value("${notifications.resend.api-url:https://api.resend.com}") String apiUrl) {
        this.client = RestClient.builder()
                .baseUrl(stripTrailingSlash(apiUrl))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return hasText(apiKey) && hasText(from);
    }

    @Override
    public void send(String recipient, String subject, String message, String idempotencyKey) {
        send(recipient, subject, message, null, idempotencyKey);
    }

    @Override
    public void send(String recipient, String subject, String textBody, String htmlBody,
                     String idempotencyKey) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", from);
        payload.put("to", List.of(recipient));
        payload.put("subject", subject);
        payload.put("text", textBody);
        if (hasText(htmlBody)) {
            payload.put("html", htmlBody);
        }

        client.post()
                .uri("/emails")
                .headers(headers -> {
                    headers.setBearerAuth(apiKey);
                    if (hasText(idempotencyKey)) {
                        headers.set("Idempotency-Key", idempotencyKey);
                    }
                })
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        log.info("Voucher email accepted by Resend: {}", idempotencyKey);
    }

    private static String stripTrailingSlash(String value) {
        if (!hasText(value)) {
            return "https://api.resend.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
