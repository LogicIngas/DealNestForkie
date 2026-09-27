package za.ac.cput.dealnest.util;

import za.ac.cput.dealnest.domain.CardBrand;
import za.ac.cput.dealnest.domain.CardCheckResult;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * Structural validation of card details.
 *
 * <p>This checks whether a card number is <em>well formed</em>: the checksum the
 * scheme defines, the digit count that scheme uses, an expiry that is real and in
 * the future, and a security code of the right size. It cannot tell you whether the
 * card exists, is active, or has money on it. A number invented to satisfy the
 * checksum passes every check here, and only the card issuer's network knows the
 * difference — so nothing in this class should ever be described as proof that a
 * card is real.
 *
 * <p>Deliberately absent: any storage, logging or transmission of the number. The
 * only part that leaves this class is {@link CardCheckResult#last4()}, which is
 * what a receipt is allowed to show.
 */
public final class CardValidator {

    /** Longest expiry a real card is expected to carry, to catch 12/99 typos. */
    private static final int MAX_EXPIRY_YEARS_AHEAD = 20;

    private CardValidator() {
    }

    /**
     * Runs every check and returns all of them, passed or not, so a caller can
     * show the customer the whole picture instead of the first problem it hit.
     *
     * @param cardNumber  as typed, spaces and dashes allowed
     * @param expiry      {@code MM/YY} or {@code MM/YYYY}
     * @param cvv         the security code, as typed
     * @param holderName  the name printed on the card
     */
    public static CardCheckResult check(String cardNumber, String expiry, String cvv, String holderName) {
        String digits = normalise(cardNumber);
        CardBrand brand = CardBrand.detect(digits);
        List<CardCheckResult.Check> checks = new ArrayList<>();

        checks.add(checkCharacters(cardNumber, digits));
        checks.add(checkLength(brand, digits));
        checks.add(checkRecognisedBrand(brand));
        checks.add(checkLuhn(digits));
        checks.add(checkExpiry(expiry));
        checks.add(checkCvv(cvv, brand));
        checks.add(checkHolderName(holderName));

        return new CardCheckResult(brand, last4(digits), List.copyOf(checks));
    }

    /** Convenience for a number on its own, which is the part a demo usually shows. */
    public static boolean isStructurallyValidCardNumber(String cardNumber) {
        String digits = normalise(cardNumber);
        if (digits.isEmpty()) {
            return false;
        }
        CardBrand brand = CardBrand.detect(digits);
        return brand != CardBrand.UNKNOWN && brand.acceptsLength(digits.length()) && passesLuhn(digits);
    }

    /** The final four digits of a number as typed, or "" when there are not four. */
    public static String lastFour(String cardNumber) {
        String digits = normalise(cardNumber);
        return digits.length() < 4 ? "" : digits.substring(digits.length() - 4);
    }

    public static String normalise(String cardNumber) {
        if (cardNumber == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(cardNumber.length());
        for (int i = 0; i < cardNumber.length(); i++) {
            char c = cardNumber.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(c);
            } else if (c != ' ' && c != '-' && c != '\u00a0') {
                // Anything other than a separator means this is not a bare number.
                return "";
            }
        }
        return sb.toString();
    }

    private static String last4(String digits) {
        if (digits.length() < 4) {
            return "";
        }
        return digits.substring(digits.length() - 4);
    }

    private static CardCheckResult.Check checkCharacters(String asTyped, String digits) {
        boolean ok = !digits.isEmpty();
        return new CardCheckResult.Check(
                "cardNumber.characters",
                "Card number contains digits only",
                ok,
                ok ? "Digits and separators only" : "A card number may only contain digits, spaces or dashes");
    }

    private static CardCheckResult.Check checkLength(CardBrand brand, String digits) {
        if (digits.isEmpty()) {
            return new CardCheckResult.Check("cardNumber.length", "Card number length", false,
                    "Enter a card number");
        }
        boolean ok = brand.acceptsLength(digits.length());
        return new CardCheckResult.Check(
                "cardNumber.length",
                "Card number length",
                ok,
                ok ? brand.getDisplayName() + " numbers are " + digits.length() + " digits"
                        : brand.getDisplayName() + " numbers are " + brand.validLengthsAsText()
                        + " digits, this one is " + digits.length());
    }

    private static CardCheckResult.Check checkRecognisedBrand(CardBrand brand) {
        boolean ok = brand != CardBrand.UNKNOWN;
        return new CardCheckResult.Check(
                "cardNumber.scheme",
                "Recognised card scheme",
                ok,
                ok ? brand.getDisplayName()
                        : "The first digits do not belong to any known card scheme");
    }

    private static CardCheckResult.Check checkLuhn(String digits) {
        boolean ok = passesLuhn(digits);
        return new CardCheckResult.Check(
                "cardNumber.luhn",
                "Checksum (Luhn)",
                ok,
                ok ? "Checksum matches" : "The checksum does not match, so a digit is wrong or mistyped");
    }

    /**
     * The mod-10 checksum every major scheme uses: from the right, double every
     * second digit, subtract 9 from any result above 9, and the total must be a
     * multiple of ten.
     */
    static boolean passesLuhn(String digits) {
        if (digits.isEmpty() || !digits.chars().allMatch(c -> c >= '0' && c <= '9')) {
            return false;
        }
        int sum = 0;
        boolean doubleDigit = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int value = digits.charAt(i) - '0';
            if (doubleDigit) {
                value *= 2;
                if (value > 9) {
                    value -= 9;
                }
            }
            sum += value;
            doubleDigit = !doubleDigit;
        }
        return sum % 10 == 0;
    }

    private static CardCheckResult.Check checkExpiry(String expiry) {
        YearMonth parsed = parseExpiry(expiry);
        if (parsed == null) {
            return new CardCheckResult.Check("expiry", "Expiry date", false,
                    "Use MM/YY, for example 04/29");
        }
        YearMonth now = YearMonth.now();
        if (parsed.isBefore(now)) {
            return new CardCheckResult.Check("expiry", "Expiry date", false,
                    "This card expired in " + monthYear(parsed));
        }
        if (parsed.isAfter(now.plusYears(MAX_EXPIRY_YEARS_AHEAD))) {
            return new CardCheckResult.Check("expiry", "Expiry date", false,
                    "That expiry is too far in the future to be a real card");
        }
        return new CardCheckResult.Check("expiry", "Expiry date", true,
                "Valid until " + monthYear(parsed));
    }

    /**
     * Accepts {@code MM/YY} and {@code MM/YYYY}, rejects month 00 and 13, and
     * applies the usual two-digit year convention: 29 is 2029, not 1929.
     */
    static YearMonth parseExpiry(String expiry) {
        if (expiry == null) {
            return null;
        }
        String trimmed = expiry.trim();
        int slash = trimmed.indexOf('/');
        if (slash < 0) {
            return null;
        }
        String monthPart = trimmed.substring(0, slash).trim();
        String yearPart = trimmed.substring(slash + 1).trim();
        if (monthPart.length() != 2 || (yearPart.length() != 2 && yearPart.length() != 4)) {
            return null;
        }
        Integer month = asInt(monthPart);
        Integer year = asInt(yearPart);
        if (month == null || year == null || month < 1 || month > 12) {
            return null;
        }
        if (yearPart.length() == 2) {
            int fullYear = 2000 + year;
            // "29" means 2029, not 1929. No card is valid 90 years out, so a value
            // that lands far in the past is meant to be the next century instead.
            // Whatever nonsense survives that is caught by the expiry check, which
            // refuses anything implausibly far in the future.
            if (fullYear < YearMonth.now().getYear() - MAX_EXPIRY_YEARS_AHEAD) {
                fullYear += 100;
            }
            year = fullYear;
        }
        return YearMonth.of(year, month);
    }

    private static String monthYear(YearMonth value) {
        return String.format("%02d/%d", value.getMonthValue(), value.getYear());
    }

    private static CardCheckResult.Check checkCvv(String cvv, CardBrand brand) {
        String trimmed = cvv == null ? "" : cvv.trim();
        int expected = brand == CardBrand.UNKNOWN ? 3 : brand.getCvvLength();
        boolean digitsOnly = !trimmed.isEmpty() && trimmed.chars().allMatch(c -> c >= '0' && c <= '9');
        boolean ok = digitsOnly && trimmed.length() == expected;
        return new CardCheckResult.Check(
                "cvv",
                "Security code",
                ok,
                ok ? expected + " digits"
                        : (digitsOnly
                        ? "This card uses " + expected + " digits"
                        : "The security code is digits only"));
    }

    private static CardCheckResult.Check checkHolderName(String holderName) {
        String trimmed = holderName == null ? "" : holderName.trim().replaceAll("\\s+", " ");
        boolean ok = trimmed.length() >= 2 && trimmed.length() <= 60
                && trimmed.matches("[A-Za-z][A-Za-z .'-]*");
        return new CardCheckResult.Check(
                "holderName",
                "Name on card",
                ok,
                ok ? "Accepted"
                        : "Enter the name printed on the card (letters, spaces, hyphens and apostrophes)");
    }

    private static Integer asInt(String value) {
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
