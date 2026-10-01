package za.ac.cput.dealnest.util;

/**
 * Thrown when a registration or profile edit asks for an address another account
 * already holds. Checked explicitly rather than left to the unique constraint,
 * which would arrive as a DataIntegrityViolationException and be reported as the
 * generic "this record already exists".
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

    private final String email;

    public EmailAlreadyRegisteredException(String email) {
        super("An account with that email address already exists.");
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
