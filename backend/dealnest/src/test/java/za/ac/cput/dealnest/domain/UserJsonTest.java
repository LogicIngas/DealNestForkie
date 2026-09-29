package za.ac.cput.dealnest.domain;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The password lives on a public endpoint by proxy: a promotion carries its store, the
 * store carries its owner, and the deal feed is {@code permitAll}. So whatever the user
 * maps to is reachable without signing in.
 *
 * <p>Two things have to stay true at once, and they pull in opposite directions. The
 * hash must not appear in any response, and the {@code password} field in a sign-up or
 * sign-in body must still bind — hiding it too aggressively silently creates accounts
 * and logs people in with a null password, which is both a worse bug and a much harder
 * one to spot than the leak it was meant to prevent.
 *
 * <p>These run on a stock mapper rather than the application's, because the behaviour
 * under test is fixed by the annotations on {@link User} and not by anything
 * {@code application.properties} configures. That also keeps the test from needing a
 * context, let alone a database.
 */
class UserJsonTest {

    private final ObjectMapper mapper = JsonMapper.builder().build();

    private User userWithPassword(String hash) {
        return new User.Builder()
                .setUserID("user-1")
                .setEmail("buyer@example.com")
                .setFirstName("Thandi")
                .setPassword(hash)
                .build();
    }

    @Test
    void aSerialisedUserCarriesNoPassword() {
        String json = mapper.writeValueAsString(userWithPassword("$2a$10$N9qo8uLOickgx2ZMRZoMye"));

        assertFalse(json.contains("password"),
                "the hash is reachable from the unauthenticated deal feed, so it must not be serialised: " + json);
        assertFalse(json.contains("$2a$10$"),
                "the hash itself must not appear even under a different key: " + json);
    }

    @Test
    void serialisingAUserStillWritesTheFieldsTheUiNeeds() {
        // Guards the opposite mistake: ignoring the whole User, or the whole property
        // range, would also hide the e-mail and name the account page renders.
        String json = mapper.writeValueAsString(userWithPassword("$2a$10$N9qo8uLOickgx2ZMRZoMye"));

        assertTrue(json.contains("buyer@example.com"), json);
        assertTrue(json.contains("Thandi"), json);
    }

    @Test
    void anInboundPasswordStillBinds() throws Exception {
        // The annotation that hides the hash on output must not stop the hash being
        // accepted on input, which is how every sign-up and sign-in arrives.
        User user = mapper.readValue(
                "{\"email\":\"buyer@example.com\",\"password\":\"hunter2\"}", User.class);

        assertEquals("hunter2", user.getPassword());
    }
}
