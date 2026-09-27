package za.ac.cput.dealnest.domain;

/**
 * Result of asking a payment network to authorise an amount against a card.
 *
 * <p>Nothing here is a statement about a real card. When this is produced by the
 * simulated path the outcome was decided locally from a table of well-known test
 * numbers, so it says only what a network would have been asked and what the
 * stand-in for the network replied.
 *
 * @param outcome    whether the request was authorised
 * @param reasonCode machine-readable reason, {@code approved} or a decline code
 * @param message    wording fit to show the customer
 * @param reference  this attempt's identifier, safe to quote back
 * @param authCode   the six-digit code an approval carries; null when declined
 * @param brand      the scheme the number claimed to be
 * @param last4      the last four digits, the only part of the card carried anywhere
 * @param amountCents the amount that was asked for
 */
public record AuthorisationResult(
        Outcome outcome,
        String reasonCode,
        String message,
        String reference,
        String authCode,
        CardBrand brand,
        String last4,
        long amountCents) {

    public enum Outcome {
        APPROVED,
        DECLINED
    }

    public boolean isApproved() {
        return outcome == Outcome.APPROVED;
    }
}
