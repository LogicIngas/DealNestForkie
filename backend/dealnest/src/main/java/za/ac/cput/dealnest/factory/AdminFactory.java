package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.util.Helper;

public class AdminFactory {

    public static Admin createAdmin(String email, String passwordHash) {
        if (Helper.isNullOrEmpty(email) || Helper.isNullOrEmpty(passwordHash) ||
            !Helper.isValidEmail(email)) {
            return null;
        }

        return new Admin.Builder()
                .setEmail(email)
                .setPasswordHash(passwordHash)
                .setActive(true)
                .build();
    }
}
