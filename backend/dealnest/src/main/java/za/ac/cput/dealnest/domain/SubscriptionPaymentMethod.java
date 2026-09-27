package za.ac.cput.dealnest.domain;

/**
 * How a plan is paid for.
 *
 * <p>{@link #CARD} is a real PayFast recurring subscription (subscription_type=1)
 * that renews monthly by itself. PayFast only supports recurring billing on a
 * card, so {@link #EFT} is a one-off Instant EFT payment that grants the same
 * 30 days of access and then lapses — the payer re-pays to continue. The bank
 * name, account type, account number and branch code are entered on PayFast's
 * hosted page, never in DealNest.</p>
 */
public enum SubscriptionPaymentMethod {
    CARD,
    EFT
}
