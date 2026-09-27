package za.ac.cput.dealnest.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import za.ac.cput.dealnest.domain.CardBrand;
import za.ac.cput.dealnest.domain.CardCheckResult;

import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The card checks. These are the rules a customer is told their card failed, so
 * each one gets a test that states what it should accept and what it should
 * refuse — a wrong answer here is a wrong message on someone's checkout.
 */
class CardValidatorTest {

    // The widely published test numbers. Every one satisfies the Luhn checksum,
    // which is the point: a real card and a demo card are indistinguishable until
    // a network is asked.
    private static final String VISA = "4111111111111111";
    private static final String MASTERCARD = "5555555555554444";
    private static final String AMEX = "378282246310005";

    @Test
    void acceptsTheStandardTestNumbersForEveryMajorScheme() {
        assertTrue(CardValidator.isStructurallyValidCardNumber(VISA));
        assertTrue(CardValidator.isStructurallyValidCardNumber(MASTERCARD));
        assertTrue(CardValidator.isStructurallyValidCardNumber(AMEX));
    }

    @ParameterizedTest(name = "{0} should be a {1}")
    @CsvSource({
            "4111111111111111, VISA",
            "4012888888881881, VISA",
            "5555555555554444, MASTERCARD",
            "5105105105105100, MASTERCARD",
            "2223003122003222, MASTERCARD",
            "378282246310005, AMERICAN_EXPRESS",
            "371449635398431, AMERICAN_EXPRESS",
            "6011111111111117, DISCOVER",
            "3530111333300000, JCB",
            "30569309025904, DINERS_CLUB",
            "6200000000000005, UNIONPAY"
    })
    void identifiesTheSchemeFromTheLeadingDigits(String number, CardBrand expected) {
        assertEquals(expected, CardBrand.detect(number));
    }

    @Test
    void readsMastercardTheTwoToSevenSeriesTheSameAsTheFiveSeries() {
        // 2221-2720 was added when the 51-55 range ran out. Missing it would
        // reject cards people are actually being issued.
        assertEquals(CardBrand.MASTERCARD, CardBrand.detect("2223003122003222"));
        assertEquals(CardBrand.MASTERCARD, CardBrand.detect("2720990000000000"));
        assertEquals(CardBrand.UNKNOWN, CardBrand.detect("2213003122003222"));
    }

    @Test
    void distinguishesAmexFromDinersBothOfWhichStartWithThree() {
        // 34/37 is Amex, 36 is Diners. Getting this backwards would demand a
        // 4-digit security code from an Amex customer and 3 from a Diners one.
        assertEquals(CardBrand.AMERICAN_EXPRESS, CardBrand.detect("378282246310005"));
        assertEquals(CardBrand.DINERS_CLUB, CardBrand.detect("36227206271667"));
    }

    @Test
    void rejectsANumberThatFailsTheChecksum() {
        // The last digit of 4111111111111111 changed, so the sum no longer divides
        // by ten. Visually it is still a plausible card number.
        assertFalse(CardValidator.isStructurallyValidCardNumber("4111111111111112"));
    }

    @Test
    void rejectsATranspositionEvenThoughEveryDigitIsValid() {
        // Swapping two adjacent digits leaves every digit a plausible digit, which
        // is exactly the mistake the checksum exists to catch. The 4 and the 1 next
        // to it are used because a transposition of two equal digits would, quite
        // correctly, still pass.
        assertFalse(CardValidator.isStructurallyValidCardNumber("1411111111111111"));
    }

    @Test
    void rejectsANumberOfTheWrongLengthForItsScheme() {
        // 13 digits is a real Visa length, so this one must pass...
        assertTrue(CardValidator.isStructurallyValidCardNumber("4222222222222"));
        // ...but 14 is not, even though every digit is a digit.
        assertFalse(CardValidator.isStructurallyValidCardNumber("41111111111111"));
    }

    @Test
    void acceptsSpacesAndDashesBecausePeopleTypeThem() {
        assertTrue(CardValidator.isStructurallyValidCardNumber("4111 1111 1111 1111"));
        assertTrue(CardValidator.isStructurallyValidCardNumber("4111-1111-1111-1111"));
    }

    @Test
    void rejectsAnythingOtherThanDigitsAndSeparators() {
        assertFalse(CardValidator.isStructurallyValidCardNumber("41111111111111a1"));
        assertFalse(CardValidator.isStructurallyValidCardNumber("4111111111111111/2"));
    }

    @Test
    void rejectsANumberBelongingToNoKnownScheme() {
        assertFalse(CardValidator.isStructurallyValidCardNumber("9999999999999995"));
        assertEquals(CardBrand.UNKNOWN, CardBrand.detect("9999999999999995"));
    }

    @Test
    void rejectsAnEmptyOrMissingNumber() {
        assertFalse(CardValidator.isStructurallyValidCardNumber(""));
        assertFalse(CardValidator.isStructurallyValidCardNumber(null));
    }

    // --- expiry ---------------------------------------------------------------

    @Test
    void acceptsAnExpiryInTheFutureInEitherLength() {
        YearMonth nextYear = YearMonth.now().plusYears(1);
        String fourDigit = String.format("%02d/%d", nextYear.getMonthValue(), nextYear.getYear());
        String twoDigit = String.format("%02d/%02d", nextYear.getMonthValue(), nextYear.getYear() % 100);
        assertNotNull(CardValidator.parseExpiry(fourDigit));
        assertNotNull(CardValidator.parseExpiry(twoDigit));
    }

    @Test
    void readsTheCurrentMonthAsStillValid() {
        // The card is good through the last day of its expiry month, so the
        // current month must not read as expired.
        YearMonth now = YearMonth.now();
        assertNotNull(CardValidator.parseExpiry(String.format("%02d/%02d", now.getMonthValue(), now.getYear() % 100)));
    }

    @Test
    void readsLastMonthAsExpired() {
        YearMonth lastMonth = YearMonth.now().minusMonths(1);
        String expiry = String.format("%02d/%02d", lastMonth.getMonthValue(), lastMonth.getYear() % 100);
        CardCheckResult result = CardValidator.check(VISA, expiry, "123", "Test Customer");
        assertNotNull(result.failure("expiry"), "a card that expired last month should fail");
    }

    @ParameterizedTest
    @ValueSource(strings = {"13/29", "00/29", "04", "0429", "04/2", "04/20299", "ab/cd", ""})
    void rejectsAnExpiryItCannotRead(String expiry) {
        assertNull(CardValidator.parseExpiry(expiry));
    }

    @Test
    void readsATwoDigitYearAsThisCenturyRatherThanTheLast() {
        // 29 means 2029. Reading it as 1929 would expire a valid card.
        YearMonth parsed = CardValidator.parseExpiry("12/29");
        assertEquals(2029, parsed.getYear());
    }

    @Test
    void rejectsAnExpirySoFarAheadItMustBeATypo() {
        // 12/99 parses as a real month and year, so only the plausibility check
        // stands between it and a card that claims to be good until 2099.
        assertNotNull(CardValidator.parseExpiry("12/99"));
        assertNotNull(CardValidator.check(VISA, "12/99", "123", "Test Customer").failure("expiry"));
    }

    // --- security code --------------------------------------------------------

    @Test
    void wantsFourSecurityCodeDigitsForAmexAndThreeForEveryoneElse() {
        assertEquals(4, CardBrand.AMERICAN_EXPRESS.getCvvLength());
        assertEquals(3, CardBrand.VISA.getCvvLength());

        assertNull(check(AMEX, "1234").failure("cvv"), "Amex takes 4");
        assertNotNull(check(AMEX, "123").failure("cvv"), "Amex does not take 3");
        assertNull(check(VISA, "123").failure("cvv"), "Visa takes 3");
        assertNotNull(check(VISA, "1234").failure("cvv"), "Visa does not take 4");
    }

    @Test
    void rejectsASecurityCodeThatIsNotDigits() {
        assertNotNull(check(VISA, "12a").failure("cvv"));
    }

    // --- reported checks ------------------------------------------------------

    @Test
    void reportsEveryCheckSoTheFormCanShowWhatPassed() {
        CardCheckResult result = CardValidator.check(VISA, "04/29", "123", "Test Customer");
        assertTrue(result.isValid());
        assertEquals(7, result.checks().size(), "all seven checks should be reported, passed or not");
        assertTrue(result.checks().stream().allMatch(CardCheckResult.Check::passed));
    }

    @Test
    void namesTheFirstProblemWhenSeveralAreWrong() {
        CardCheckResult result = CardValidator.check("1234", "13/20", "1", "");
        assertFalse(result.isValid());
        assertNotNull(result.firstFailureMessage());
        assertTrue(result.failure("cardNumber.luhn") != null, "the checksum should be reported as failed");
        assertTrue(result.failure("expiry") != null, "an unreadable expiry should be reported as failed");
        assertTrue(result.failure("holderName") != null, "a blank name should be reported as failed");
    }

    @Test
    void keepsOnlyTheLastFourDigitsAndNeverTheWholeNumber() {
        CardCheckResult result = CardValidator.check(VISA, "04/29", "123", "Test Customer");
        assertEquals("1111", result.last4());
        assertEquals("VISA", result.brand().name());
    }

    @Test
    void acceptsTheNameFormsPrintedOnRealCards() {
        for (String name : new String[]{"J van der Merwe", "O'Brien", "Mary-Jane Smith", "A. B. Cooper"}) {
            assertNull(CardValidator.check(VISA, "04/29", "123", name).failure("holderName"),
                    "should accept the name " + name);
        }
    }

    @Test
    void rejectsNamesThatAreClearlyNotOnACard() {
        for (String name : new String[]{"", " ", "x", "<script>", "12345", "a".repeat(61)}) {
            assertNotNull(CardValidator.check(VISA, "04/29", "123", name).failure("holderName"),
                    "should reject the name '" + name + "'");
        }
    }

    private CardCheckResult check(String number, String cvv) {
        return CardValidator.check(number, "04/29", cvv, "Test Customer");
    }
}
