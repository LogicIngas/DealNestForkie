package za.ac.cput.dealnest.service;

public interface EmailNotificationSender {
    boolean isConfigured();

    void send(String recipient, String subject, String message, String idempotencyKey);
}
