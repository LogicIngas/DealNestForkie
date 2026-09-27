package za.ac.cput.dealnest.domain;

/**
 * How a plan is paid for.
 *
 * <p>{@link #CARD} is paid with a card entered on DealNest's own checkout, which
 * validates the details and then stands in for the authorisation step.
 * {@link #EFT} is a one-off bank transfer that grants the same 30 days of access
 * and then lapses — the payer re-pays to continue.
 *
 * <p>Neither method takes real money: taking money would need a card network or a
 * bank, which is a merchant agreement rather than something this codebase can do.
 */
public enum SubscriptionPaymentMethod {
    CARD,
    EFT
}
