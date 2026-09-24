package za.ac.cput.dealnest.util;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * PayFast signature + ITN verification helpers. Mirrors the official PHP
 * reference implementation: params keep their insertion order (the hosted-page
 * signature requires the order the attributes appear in the docs table — NOT
 * alphabetical, which is only for the API signature), empty values skipped,
 * values url-encoded with spaces as '+', an optional
 * {@code &passphrase=<urlencoded>} appended for signature verification, then
 * MD5 hashed (lowercase hex). ITNs are additionally confirmed server-to-server
 * against /eng/query/validate, which returns {@code VALID}.
 */
public final class PayFastUtil {

    private PayFastUtil() {
    }

    /** Canonical query string used for signatures and validate calls. */
    public static String paramString(Map<String, String> data, boolean excludeSignature, String passphrase) {
        LinkedHashMap<String, String> ordered = new LinkedHashMap<>(data);
        if (excludeSignature) {
            ordered.remove("signature");
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : ordered.entrySet()) {
            if (entry.getValue() == null) continue;
            String value = entry.getValue().trim();
            if (value.isEmpty()) continue;
            if (sb.length() > 0) sb.append('&');
            sb.append(entry.getKey()).append('=').append(encode(value));
        }
        if (passphrase != null && !passphrase.isBlank()) {
            sb.append("&passphrase=").append(encode(passphrase));
        }
        return sb.toString();
    }

    public static String signature(Map<String, String> fields, String passphrase) {
        return md5Hex(paramString(fields, true, passphrase));
    }

    /**
     * True when the ITN's posted signature matches PayFast's signature, computed
     * over the RAW posted body. PayFast signs {@code md5(<exact url-encoded
     * key=value pairs in posted order, EXCLUDING signature> + &passphrase=...)}.
     * Rebuilding from a decoded Map would scramble that order and change the
     * encoding of values, so we must validate against the raw body verbatim.
     */
    public static boolean validItnSignature(String rawBody, String passphrase) {
        String expected = extractPostedValue(rawBody, "signature");
        if (expected == null || expected.isBlank()) return false;
        return expected.equalsIgnoreCase(md5Hex(signedString(rawBody, passphrase)));
    }

    /** True when PayFast's /eng/query/validate confirms the ITN is genuine. */
    public static boolean validServerConfirmation(String rawBody, boolean sandbox) {
        String host = sandbox ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za";
        String body = stripSignature(rawBody);
        if (body.isBlank()) return false;
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest request = HttpRequest.newBuilder(URI.create(host + "/eng/query/validate"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && "VALID".equalsIgnoreCase(response.body().trim());
        } catch (Exception ex) {
            return false;
        }
    }

    /** The exact signed string PayFast produced: raw pairs in posted order, minus signature, plus passphrase. */
    private static String signedString(String rawBody, String passphrase) {
        StringBuilder sb = new StringBuilder(stripSignature(rawBody));
        if (passphrase != null && !passphrase.isBlank()) {
            sb.append("&passphrase=").append(encode(passphrase));
        }
        return sb.toString();
    }

    /** Raw {@code key=value&...} pairs from the posted body, minus the signature pair. */
    static String stripSignature(String rawBody) {
        StringBuilder sb = new StringBuilder();
        if (rawBody == null) return "";
        for (String pair : rawBody.split("&")) {
            if (pair.isBlank()) continue;
            String key = pair;
            int eq = pair.indexOf('=');
            if (eq >= 0) key = pair.substring(0, eq);
            if ("signature".equalsIgnoreCase(key)) continue;
            if (sb.length() > 0) sb.append('&');
            sb.append(pair);
        }
        return sb.toString();
    }

    /** URL-decoded value of a field from the raw posted body, or null when absent. */
    private static String extractPostedValue(String rawBody, String wantedKey) {
        if (rawBody == null) return null;
        for (String pair : rawBody.split("&")) {
            int eq = pair.indexOf('=');
            if (eq <= 0) continue;
            String key = pair.substring(0, eq);
            if (!wantedKey.equalsIgnoreCase(key)) continue;
            try {
                return URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            } catch (Exception ex) {
                return null;
            }
        }
        return null;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("MD5 digest unavailable", ex);
        }
    }
}