package za.ac.cput.dealnest.domain;

import java.util.List;

/**
 * Outcome of checking a card, reported as a list of named checks rather than one
 * boolean. A card check that can only say "invalid" is not much use to anybody: the
 * person holding the card needs to know which rule it broke, and the person
 * integrating the payment needs the same information to decide whether to retry,
 * re-prompt or stop.
 *
 * @param brand   the scheme the number claims to be, or {@link CardBrand#UNKNOWN}
 * @param last4   the final four digits, safe to display and to keep; the rest of
 *                the number is deliberately not carried anywhere
 * @param checks  every check that was run, in the order it was run, passed or not
 */
public record CardCheckResult(CardBrand brand, String last4, List<Check> checks) {

    /**
     * One named rule and whether it held.
     *
     * @param id     stable identifier, safe for clients to branch on
     * @param label  human wording, written for whoever typed the card
     * @param passed whether the rule held
     * @param detail why it failed, or a short confirmation when it passed
     */
    public record Check(String id, String label, boolean passed, String detail) {
    }

    public boolean isValid() {
        return checks.stream().allMatch(Check::passed);
    }

    public List<Check> failures() {
        return checks.stream().filter(check -> !check.passed()).toList();
    }

    public Check failure(String id) {
        return checks.stream()
                .filter(check -> !check.passed() && check.id().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Single sentence naming the first thing that is wrong, for a message that has
     * to fit on one line. The order of {@link #checks} is the order of importance.
     */
    public String firstFailureMessage() {
        Check first = failures().stream().findFirst().orElse(null);
        return first == null ? null : first.detail();
    }
}
