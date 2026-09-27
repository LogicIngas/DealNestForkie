package za.ac.cput.dealnest.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.AuthorisationResult;
import za.ac.cput.dealnest.domain.CardBrand;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CardPaymentServiceTest {

    private static final String VISA = "4111111111111111";
    private static final String VALID_EXPIRY = "04/29";
    private static final String VALID_CVV = "123";
    private static final String HOLDER = "Test Customer";

    private final SubscriptionService subscriptionService = mock(SubscriptionService.class);
    private final CardPaymentService service = new CardPaymentService(subscriptionService, true);

    @Test
    void approvesAWellFormedCardAndReturnsAReference() {
        AuthorisationResult result = service.authorise(VISA, 4900);

        assertTrue(result.isApproved());
        assertEquals("approved", result.reasonCode());
        assertEquals(CardBrand.VISA, result.brand());
        assertEquals("1111", result.last4());
        assertNotNull(result.reference());
        assertTrue(result.reference().startsWith("SIM-"));
        assertNotNull(result.authCode(), "an approval carries an authorisation code");
        assertEquals(4900, result.amountCents());
    }

    @Test
    void givesEachAttemptItsOwnReference() {
        assertFalse(service.authorise(VISA, 4900).reference()
                .equals(service.authorise(VISA, 4900).reference()));
    }

    @Test
    void refusesAMalformedNumberWithoutEverReachingAuthorisation() {
        AuthorisationResult result = service.authorise("4111111111111112", 4900);

        assertFalse(result.isApproved());
        assertEquals("invalid_card_number", result.reasonCode());
        assertNull(result.authCode(), "a decline carries no authorisation code");
    }

    @Test
    void playsBackEachDeclineScenarioWithItsOwnReason() {
        // These are the reasons a customer can actually act on, so each one has to
        // come back distinct rather than as one generic "declined".
        assertEquals("insufficient_funds", service.authorise("4000000000009995", 4900).reasonCode());
        assertEquals("expired_card", service.authorise("4000000000000069", 4900).reasonCode());
        assertEquals("incorrect_cvv", service.authorise("4000000000000127", 4900).reasonCode());
        assertEquals("do_not_honour", service.authorise("4000000000000341", 4900).reasonCode());
        assertEquals("card_declined", service.authorise("4000000000000002", 4900).reasonCode());
        assertEquals("card_declined", service.authorise("5100000000000016", 4900).reasonCode());
    }

    @Test
    void saysSomethingAReaderCanActOnForEveryDecline() {
        for (String number : new String[]{"4000000000009995", "4000000000000069", "4000000000000002"}) {
            AuthorisationResult result = service.authorise(number, 4900);
            assertNotNull(result.message());
            assertFalse(result.message().isBlank(), "a decline needs wording, not just a code");
        }
    }

    @Test
    void treatsSpacesAndDashesInTheNumberAsTheSameCard() {
        // A customer who types a spaced number must not get a different verdict,
        // and a spaced number must still hit the decline table by its digits.
        assertTrue(service.authorise("4111 1111 1111 1111", 4900).isApproved());
        assertTrue(service.authorise("4111-1111-1111-1111", 4900).isApproved());
        assertEquals("insufficient_funds", service.authorise("4000 0000 0000 9995", 4900).reasonCode());
    }

    @Test
    void neverCarriesTheCardNumberOutOfTheAuthorisation() {
        AuthorisationResult result = service.authorise(VISA, 4900);

        // The last four digits are kept on purpose — that is what a receipt shows.
        assertEquals("1111", result.last4());
        // The rest of the number goes nowhere: not in the reference, the message,
        // the reason code, the authorisation code, or the record as a whole.
        String everything = result.brand() + "|" + result.last4() + "|" + result.reference()
                + "|" + result.authCode() + "|" + result.message() + "|" + result.reasonCode();
        assertFalse(everything.contains(VISA), "the card number must not appear in the result");
    }

    // --- the production guard -------------------------------------------------

    @Test
    void refusesToRunAtAllWhenSwitchedOff() {
        CardPaymentService disabled = new CardPaymentService(subscriptionService, false);

        ResponseStatusException check = assertThrows(ResponseStatusException.class,
                () -> disabled.check(VISA, VALID_EXPIRY, VALID_CVV, HOLDER));
        assertEquals(404, check.getStatusCode().value());

        assertThrows(ResponseStatusException.class, () -> disabled.authorise(VISA, 4900));
        assertThrows(ResponseStatusException.class, () -> disabled.pay(
                VISA, VALID_EXPIRY, VALID_CVV, HOLDER, SubscriptionAccountType.USER, null));
    }

    // --- the end-to-end path --------------------------------------------------

    @Test
    void grantsThePlanWhenTheAuthorisationIsApproved() {
        when(subscriptionService.planAmountCents(SubscriptionAccountType.USER)).thenReturn(4900L);
        when(subscriptionService.grantSimulatedPlan(any(), any(), anyString(), anyString(), anyString()))
                .thenReturn(Map.of("planTier", "PLUS"));

        Map<String, Object> response = service.pay(VISA, VALID_EXPIRY, VALID_CVV, HOLDER,
                SubscriptionAccountType.USER, SubscriptionPaymentMethod.CARD);

        AuthorisationResult authorisation = (AuthorisationResult) response.get("authorisation");
        assertTrue(authorisation.isApproved());
        assertNotNull(response.get("subscription"));
        assertNotNull(response.get("checks"), "the checks are returned so the form can show them");

        verify(subscriptionService).grantSimulatedPlan(
                eq(SubscriptionAccountType.USER), eq(SubscriptionPaymentMethod.CARD),
                eq("VISA"), eq("1111"), eq(authorisation.reference()));
    }

    @Test
    void authorisesTheAmountThePlanActuallyCostsNotOneTheCallerChose() {
        // A caller must not be able to name its own price.
        when(subscriptionService.planAmountCents(SubscriptionAccountType.USER)).thenReturn(19900L);
        when(subscriptionService.grantSimulatedPlan(any(), any(), anyString(), anyString(), anyString()))
                .thenReturn(Map.of());

        Map<String, Object> response = service.pay(VISA, VALID_EXPIRY, VALID_CVV, HOLDER,
                SubscriptionAccountType.USER, SubscriptionPaymentMethod.CARD);

        AuthorisationResult authorisation = (AuthorisationResult) response.get("authorisation");
        assertEquals(19900L, authorisation.amountCents());
    }

    @Test
    void grantsNothingWhenTheCardIsDeclined() {
        when(subscriptionService.planAmountCents(SubscriptionAccountType.USER)).thenReturn(4900L);

        Map<String, Object> response = service.pay("4000000000009995", VALID_EXPIRY, VALID_CVV, HOLDER,
                SubscriptionAccountType.USER, SubscriptionPaymentMethod.CARD);

        AuthorisationResult authorisation = (AuthorisationResult) response.get("authorisation");
        assertFalse(authorisation.isApproved());
        assertNull(response.get("subscription"), "a declined payment must not activate a plan");
        verify(subscriptionService, never()).grantSimulatedPlan(any(), any(), anyString(), anyString(), anyString());
    }

    @Test
    void rejectsBadDetailsBeforeAttemptingAPaymentAtAll() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.pay("4111111111111112", VALID_EXPIRY, VALID_CVV, HOLDER,
                        SubscriptionAccountType.USER, SubscriptionPaymentMethod.CARD));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getMessage().toLowerCase().contains("checksum"),
                "the message should name the rule that failed: " + ex.getMessage());
        verify(subscriptionService, never()).planAmountCents(any());
        verify(subscriptionService, never()).grantSimulatedPlan(any(), any(), anyString(), anyString(), anyString());
    }
}
