package za.ac.cput.dealnest.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Helpers for reading the current JWT-backed principal from the security context
 * (JwtAuthFilter stores the subject, i.e. the user/admin id, as the principal).
 */
public final class SecurityUtil {

    private static final String ANONYMOUS = "anonymousUser";

    private SecurityUtil() {
    }

    public static boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    /** Returns the id of the signed-in user, or null when no valid session exists. */
    public static String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof String subject && !ANONYMOUS.equals(subject)) {
            return subject;
        }
        return null;
    }
}