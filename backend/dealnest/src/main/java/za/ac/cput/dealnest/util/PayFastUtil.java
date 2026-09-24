package za.ac.cput.dealnest.util;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Map;
import java.util.TreeMap;

/**
 * PayFast signature + ITN verification helpers. Mirrors the official PHP
 * reference implementation: params are sorted by key, empty values skipped,
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
        TreeMap<String, String> sorted = new TreeMap<>(data);
        if (excludeSignature) {
            sorted.remove("signature");
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
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

    /** True when the ITN's posted signature matches the canonical signature. */
    public static boolean validSignature(Map<String, String> params, String passphrase) {
        String expected = params.get("signature");
        if (expected == null || expected.isBlank()) return false;
        return expected.equalsIgnoreCase(signature(params, passphrase));
    }

    /** True when PayFast's /eng/query/validate confirms the ITN is genuine. */
    public static boolean validServerConfirmation(Map<String, String> params, boolean sandbox) {
        String host = sandbox ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za";
        String body = paramString(params, true, null);
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