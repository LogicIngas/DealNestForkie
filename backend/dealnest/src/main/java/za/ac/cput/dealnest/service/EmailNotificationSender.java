package za.ac.cput.dealnest.service;

public interface EmailNotificationSender {
    boolean isConfigured();

    void send(String recipient, String subject, String message, String idempotencyKey);

    /**
     * Sends a plain-text body alongside an HTML alternative. Clients that render HTML
     * show {@code htmlBody}; the rest fall back to {@code textBody}.
     *
     * <p>Defaults to the text-only send so a sender that has no HTML support keeps
     * working unchanged.
     */
    default void send(String recipient, String subject, String textBody, String htmlBody,
                      String idempotencyKey) {
        send(recipient, subject, textBody, idempotencyKey);
    }
}
