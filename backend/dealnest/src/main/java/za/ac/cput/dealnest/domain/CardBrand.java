package za.ac.cput.dealnest.domain;

/**
 * Card schemes identified from the leading digits of a card number, together with
 * the structural rules each one actually uses. The point of keeping these here
 * rather than a flat "is it 16 digits" check is that a real card check is a set of
 * independent rules, and a demo is only convincing if it can say which rule failed.
 */
public enum CardBrand {

    VISA("Visa", "4", new int[]{13, 16, 19}, 3),
    MASTERCARD("Mastercard", null, new int[]{16}, 3),
    AMERICAN_EXPRESS("American Express", null, new int[]{15}, 4),
    DISCOVER("Discover", null, new int[]{16, 19}, 3),
    JCB("JCB", null, new int[]{16, 19}, 3),
    DINERS_CLUB("Diners Club", null, new int[]{14, 16, 19}, 3),
    UNIONPAY("UnionPay", null, new int[]{16, 17, 18, 19}, 3),
    MAESTRO("Maestro", null, new int[]{12, 13, 14, 15, 16, 17, 18, 19}, 3),
    UNKNOWN("Unknown card", null, new int[]{12, 13, 14, 15, 16, 17, 18, 19}, 3);

    private final String displayName;
    private final String simplePrefix;
    private final int[] validLengths;
    private final int cvvLength;

    CardBrand(String displayName, String simplePrefix, int[] validLengths, int cvvLength) {
        this.displayName = displayName;
        this.simplePrefix = simplePrefix;
        this.validLengths = validLengths;
        this.cvvLength = cvvLength;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getCvvLength() {
        return cvvLength;
    }

    public boolean acceptsLength(int length) {
        for (int candidate : validLengths) {
            if (candidate == length) {
                return true;
            }
        }
        return false;
    }

    public String validLengthsAsText() {
        if (validLengths.length == 1) {
            return String.valueOf(validLengths[0]);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < validLengths.length; i++) {
            if (i > 0) {
                sb.append(i == validLengths.length - 1 ? " or " : ", ");
            }
            sb.append(validLengths[i]);
        }
        return sb.toString();
    }

    /**
     * Identifies the scheme from the issuer identification number.
     *
     * <p>Order matters: several ranges overlap. A number starting {@code 34} or
     * {@code 37} is American Express even though it also sits inside the
     * {@code 3}-prefixed range, and the Maestro list has to be consulted before
     * UnionPay's catch-all {@code 62} is trusted for the 6-prefixed numbers.
     */
    public static CardBrand detect(String digits) {
        if (digits == null || digits.isEmpty()) {
            return UNKNOWN;
        }

        if (digits.startsWith("4")) {
            return VISA;
        }
        if (hasNumericPrefixInRange(digits, 2, 51, 55)) {
            return MASTERCARD;
        }
        if (hasNumericPrefixInRange(digits, 4, 2221, 2720)) {
            return MASTERCARD;
        }
        if (digits.startsWith("34") || digits.startsWith("37")) {
            return AMERICAN_EXPRESS;
        }
        if (startsWithAny(digits, "6011", "65")
                || hasNumericPrefixInRange(digits, 3, 644, 649)) {
            return DISCOVER;
        }
        if (hasNumericPrefixInRange(digits, 4, 3528, 3589)) {
            return JCB;
        }
        if (hasNumericPrefixInRange(digits, 3, 300, 305)
                || digits.startsWith("36")
                || hasNumericPrefixInRange(digits, 2, 38, 39)) {
            return DINERS_CLUB;
        }
        if (startsWithAny(digits, "5018", "5020", "5038", "5893", "6304",
                "6759", "6761", "6762", "6763")) {
            return MAESTRO;
        }
        if (digits.startsWith("62")) {
            return UNIONPAY;
        }
        return UNKNOWN;
    }

    private static boolean startsWithAny(String digits, String... prefixes) {
        for (String prefix : prefixes) {
            if (digits.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * True when the first {@code length} digits parse as a number inside the
     * inclusive range. A number shorter than {@code length} cannot match, which
     * is what keeps a truncated number from being read as a low value.
     */
    private static boolean hasNumericPrefixInRange(String digits, int length, int min, int max) {
        if (digits.length() < length) {
            return false;
        }
        int value = 0;
        for (int i = 0; i < length; i++) {
            char c = digits.charAt(i);
            if (c < '0' || c > '9') {
                return false;
            }
            value = value * 10 + (c - '0');
        }
        return value >= min && value <= max;
    }
}
