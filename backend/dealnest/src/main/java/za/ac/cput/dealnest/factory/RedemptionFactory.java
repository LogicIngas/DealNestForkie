package za.ac.cput.dealnest.factory;

import java.util.UUID;

public class RedemptionFactory {

    public static String generateCode() {
        // Two UUIDs concatenated for ~48 bits of entropy while staying short
        // enough to type at a till.
        String raw = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        return "DN-" + raw.toUpperCase().substring(0, 12);
    }
}
