package za.ac.cput.dealnest.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Email validation.
 *
 * <p>An address that passes here becomes a login identity, the target of password-reset
 * links and of the voucher emails a customer shows a store. An address that fails
 * reaches none of those, so the interesting cases are the near-misses: things a
 * permissive check would wave through but no provider can deliver to.
 */
class HelperEmailTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "sam@example.co.za",
            "plus@demo.co.za",
            "first.last@example.com",
            "sam+deals@example.co.za",
            "sam_is-great@example.co.za",
            "s@e.io",
            "123@456.co.za",
            "SAM@EXAMPLE.CO.ZA"
    })
    void acceptsRealisticAddresses(String email) {
        assertTrue(Helper.isValidEmail(email), () -> "should accept: " + email);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "sam",
            "@example.co.za",
            "sam@",
            "sam@localhost",
            "sam@example",
            "sam@@example.co.za",
            "sam@exam ple.co.za",
            "sam@.co.za",
            "sam@example..co.za",
            "sam@-example.co.za",
            "sam@example-.co.za",
            "sam@example.c",
            ".sam@example.co.za",
            "sam.@example.co.za",
            "sam@exam_ple.co.za",
            "sam example@example.co.za"
    })
    void refusesAddressesNoProviderCouldIssue(String email) {
        assertFalse(Helper.isValidEmail(email), () -> "should reject: " + email);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t", "\n"})
    void refusesBlankInput(String email) {
        assertFalse(Helper.isValidEmail(email), () -> "should reject: [" + email + "]");
    }

    /**
     * A pasted address carries the surrounding whitespace of the clipboard. Storing it
     * verbatim would make " sam@example.co.za" a different account from
     * "sam@example.co.za", and the first one could never receive a reset email.
     */
    @Test
    void acceptsSurroundingWhitespaceByTrimmingIt() {
        assertTrue(Helper.isValidEmail("  sam@example.co.za  "));
    }

    @Test
    void normaliseEmailTrimsWithoutLowercasing() {
        assertEquals("sam@example.co.za", Helper.normaliseEmail("  sam@example.co.za "));
        assertEquals("SAM@Example.co.za", Helper.normaliseEmail("SAM@Example.co.za"));
        assertNull(Helper.normaliseEmail(null));
    }

    /**
     * RFC 5321 caps a full address at 254 characters. The address is built from a
     * maximal local part and legal 63-character domain labels so the assertion is
     * about the total length and not about any per-part limit underneath it.
     */
    @Test
    void refusesAddressesLongerThanRfcLimit() {
        String overLimit = "a".repeat(64) + "@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(61) + "a";
        assertTrue(overLimit.length() > 254);
        assertFalse(Helper.isValidEmail(overLimit), "excessive length should be rejected");
    }
}
