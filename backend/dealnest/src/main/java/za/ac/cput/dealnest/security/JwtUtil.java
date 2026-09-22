package za.ac.cput.dealnest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** Utility for creating and validating JWT tokens. */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long userExpiration;
    private final long adminExpiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration.user}") long userExpiration,
            @Value("${jwt.expiration.admin}") long adminExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.userExpiration = userExpiration;
        this.adminExpiration = adminExpiration;
    }

    public String generateUserToken(String userId, String email) {
        return buildToken(userId, email, "ROLE_USER", userExpiration);
    }

    public String generateAdminToken(String adminId, String email) {
        return buildToken(adminId, email, "ROLE_ADMIN", adminExpiration);
    }

    private String buildToken(String subject, String email, String role, long expirationMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try { parseClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    public String extractSubject(String token) { return parseClaims(token).getSubject(); }
    public String extractEmail(String token) { return parseClaims(token).get("email", String.class); }
    public String extractRole(String token) { return parseClaims(token).get("role", String.class); }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }
}
