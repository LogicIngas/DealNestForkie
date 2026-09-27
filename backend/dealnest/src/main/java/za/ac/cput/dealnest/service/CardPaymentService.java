package za.ac.cput.dealnest.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.AuthorisationResult;
import za.ac.cput.dealnest.domain.CardBrand;
import za.ac.cput.dealnest.domain.CardCheckResult;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;
import za.ac.cput.dealnest.util.CardValidator;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Card validation and a stand-in for the authorisation step.
 *
 * <p>This exists because a hosted gateway's sandbox cannot check a card number: the
 * card is typed on someone else's page, so nothing in the system ever sees it and
 * there is nothing to validate. Moving the entry form in front of us makes the
 * checks real, and it is also the only arrangement in which the number could be
 * handled carelessly — so the handling is the important part of this class:
 *
 * <ul>
 *   <li>The number is never stored. There is no column, no entity and no cache.</li>
 *   <li>The number is never logged, and never appears in an exception message.</li>
 *   <li>Only the brand and last four digits leave this class.</li>
 *   <li>The whole path is behind {@code payment.card-simulator.enabled}, which is
 *       off in the deployed environment.</li>
 * </ul>
 *
 * <p>What the validation proves is that the number is <em>well formed</em> for the
 * scheme it claims. It does not prove the card exists or has funds: a number
 * invented to satisfy the checksum passes. Only a card network can answer that, and
 * reaching one is a merchant agreement, not a code change.
 */
@Service
public class CardPaymentService {

    private static final Logger log = LoggerFactory.getLogger(CardPaymentService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    /**
     * The decline scenarios a demo needs to be able to show. These are the widely
     * published test numbers, all of which satisfy the Luhn checksum so they get as
     * far as the authorisation step and then bounce there — which is the behaviour
     * worth demonstrating, since a malformed number never reaches a network at all.
     */
    private static final Map<String, String[]> DECLINE_SCENARIOS = buildDeclineScenarios();

    private final SubscriptionService subscriptionService;
    private final boolean enabled;

    public CardPaymentService(SubscriptionService subscriptionService,
                              @Value("${payment.card-simulator.enabled:true}") boolean enabled) {
        this.subscriptionService = subscriptionService;
        this.enabled = enabled;
    }

    /**
     * Runs every structural check and returns all of them, so the caller can show a
     * customer which rules passed as well as which failed.
     */
    public CardCheckResult check(String cardNumber, String expiry, String cvv, String holderName) {
        requireEnabled();
        return CardValidator.check(cardNumber, expiry, cvv, holderName);
    }

    /**
     * Validates, then stands in for the network.
     *
     * <p>A structurally invalid card is declined with the reason it failed and is
     * never sent anywhere. A well-formed one is looked up in the decline table, and
     * anything not in that table is approved — because a demo needs a default that
     * works, and "approve unless this specific number says otherwise" is the least
     * surprising default there is.
     */
    public AuthorisationResult authorise(String cardNumber, long amountCents) {
        requireEnabled();
        CardBrand brand = CardBrand.detect(CardValidator.normalise(cardNumber));
        String last4 = CardValidator.lastFour(cardNumber);
        String reference = newReference();

        if (!CardValidator.isStructurallyValidCardNumber(cardNumber)) {
            log.info("Simulated authorisation {} declined on card structure, brand={} last4={}",
                    reference, brand, last4);
            return decline(reference, "invalid_card_number",
                    "That card number is not valid for " + brand.getDisplayName() + ".",
                    brand, last4, amountCents);
        }

        String[] scenario = DECLINE_SCENARIOS.get(CardValidator.normalise(cardNumber));
        if (scenario != null) {
            log.info("Simulated authorisation {} declined: {}", reference, scenario[0]);
            return decline(reference, scenario[0], scenario[1], brand, last4, amountCents);
        }

        String authCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        log.info("Simulated authorisation {} approved, brand={} last4={} amount={}",
                reference, brand, last4, amountCents);
        return new AuthorisationResult(AuthorisationResult.Outcome.APPROVED, "approved",
                "Approved.", reference, authCode, brand, last4, amountCents);
    }

    /**
     * The end-to-end demo path: validate, stand in for the network, and on approval
     * grant the plan exactly as a confirmed payment would.
     *
     * <p>The amount is resolved from the plan rather than taken from the caller, so
     * the amount authorised is always the amount actually owed.
     *
     * @return the checks, the authorisation, and the subscription state when approved
     */
    public Map<String, Object> pay(String cardNumber, String expiry, String cvv, String holderName,
                                   SubscriptionAccountType accountType,
                                   SubscriptionPaymentMethod paymentMethod) {
        requireEnabled();
        CardCheckResult check = CardValidator.check(cardNumber, expiry, cvv, holderName);
        if (!check.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Card details are not valid: " + check.firstFailureMessage());
        }

        long amountCents = subscriptionService.planAmountCents(accountType);
        AuthorisationResult authorisation = authorise(cardNumber, amountCents);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("checks", check.checks());
        response.put("authorisation", authorisation);
        if (!authorisation.isApproved()) {
            return response;
        }

        response.put("subscription", subscriptionService.grantSimulatedPlan(
                accountType, paymentMethod, authorisation.brand().name(),
                authorisation.last4(), authorisation.reference()));
        return response;
    }

    private void requireEnabled() {
        if (!enabled) {
            // Not a validation failure and not an auth failure: this path is simply
            // not present in a deployed environment.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Card validation is not enabled on this environment.");
        }
    }

    private static AuthorisationResult decline(String reference, String reasonCode, String message,
                                               CardBrand brand, String last4, long amountCents) {
        return new AuthorisationResult(AuthorisationResult.Outcome.DECLINED, reasonCode, message,
                reference, null, brand, last4, amountCents);
    }

    /**
     * Excludes 0, 1, I and O: these references get read aloud to customers and typed
     * into support tickets, so the ambiguous characters cost more than they save.
     */
    private static String newReference() {
        StringBuilder sb = new StringBuilder("SIM-");
        for (int i = 0; i < 12; i++) {
            sb.append(REFERENCE_ALPHABET[RANDOM.nextInt(REFERENCE_ALPHABET.length)]);
        }
        return sb.toString();
    }

    private static Map<String, String[]> buildDeclineScenarios() {
        Map<String, String[]> scenarios = new LinkedHashMap<>();
        scenarios.put("4000000000000002", new String[]{"card_declined", "The card was declined by the issuer."});
        scenarios.put("4000000000009995", new String[]{"insufficient_funds", "There are not enough funds on this card."});
        scenarios.put("4000000000000069", new String[]{"expired_card", "This card has expired."});
        scenarios.put("4000000000000127", new String[]{"incorrect_cvv", "The security code is incorrect."});
        scenarios.put("4000000000000341", new String[]{"do_not_honour", "The issuer asked not to honour this payment."});
        scenarios.put("4000000000000119", new String[]{"processing_error", "The payment could not be processed."});
        scenarios.put("4000000000000259", new String[]{"transaction_not_allowed", "This card does not allow this type of payment."});
        scenarios.put("5100000000000016", new String[]{"card_declined", "The card was declined by the issuer."});
        return scenarios;
    }
}
