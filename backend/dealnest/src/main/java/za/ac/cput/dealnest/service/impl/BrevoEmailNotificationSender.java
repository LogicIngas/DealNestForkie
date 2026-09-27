package za.ac.cput.dealnest.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "notifications.email.provider", havingValue = "brevo", matchIfMissing = true)
public class BrevoEmailNotificationSender implements EmailNotificationSender {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailNotificationSender.class);

    private final RestClient client;

    @Value("${notifications.brevo.api-key:}")
    private String apiKey;

    @Value("${notifications.brevo.from:}")
    private String from;

    @Value("${notifications.brevo.from-name:DealNest}")
    private String fromName;

    @Autowired
    public BrevoEmailNotificationSender(
            @Value("${notifications.brevo.api-url:https://api.brevo.com}") String apiUrl) {
        this(RestClient.builder().baseUrl(stripTrailingSlash(apiUrl)).build());
    }

    BrevoEmailNotificationSender(RestClient client) {
        this.client = client;
    }

    @Override
    public boolean isConfigured() {
        return hasText(apiKey) && hasText(from);
    }

    @Override
    public void send(String recipient, String subject, String message, String idempotencyKey) {
        Map<String, Object> sender = new LinkedHashMap<>();
        sender.put("name", hasText(fromName) ? fromName : "DealNest");
        sender.put("email", from);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sender", sender);
        payload.put("to", List.of(Map.of("email", recipient)));
        payload.put("subject", subject);
        payload.put("textContent", message);
        payload.put("tags", List.of("voucher-claim"));

        client.post()
                .uri("/v3/smtp/email")
                .headers(headers -> {
                    headers.set("api-key", apiKey);
                    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                    if (hasText(idempotencyKey)) {
                        headers.set("Idempotency-Key", asUuid(idempotencyKey));
                    }
                })
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        log.info("Voucher email accepted by Brevo: {}", idempotencyKey);
    }

    private static String asUuid(String idempotencyKey) {
        return UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8)).toString();
    }

    private static String stripTrailingSlash(String value) {
        if (!hasText(value)) {
            return "https://api.brevo.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
