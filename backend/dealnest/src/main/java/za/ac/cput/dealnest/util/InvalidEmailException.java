package za.ac.cput.dealnest.util;

/**
 * Thrown when an email address cannot be accepted. Surfaces as 400 Bad Request
 * so the caller learns the address was rejected rather than getting a generic
 * failure or, worse, a 200 with the bad value persisted.
 */
public class InvalidEmailException extends RuntimeException {

    private final String email;

    public InvalidEmailException(String email) {
        super("'" + (email == null || email.isBlank() ? "" : email) + "' is not a valid email address.");
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
