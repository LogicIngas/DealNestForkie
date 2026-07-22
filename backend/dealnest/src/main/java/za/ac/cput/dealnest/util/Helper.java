package za.ac.cput.dealnest.util;

import org.apache.commons.validator.routines.EmailValidator;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

public class Helper {

    // Matches South African style numbers and general international numbers
    // e.g. 0821234567 or +27821234567
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+?\\d{1,3})?\\d{9,12}$");

    public static boolean isNullOrEmpty(String str) {
        // Returns true if the string is actually null or empty
        if (str == null || str.isEmpty()) {
            return true;
        }
        // Returns false if the string has content
        return false;
    }

    public static boolean isValidEmail(String email) {
        EmailValidator validator = EmailValidator.getInstance();
        return validator.isValid(email);
    }

    public static boolean isValidNumber(float number) {
        if (number < 0) {
            return false;
        }
        return true;
    }

    // ---------- User / Admin User ----------

    public static boolean isValidName(String name) {
        // First/last names must not be null, empty, or purely whitespace
        if (isNullOrEmpty(name) || name.trim().isEmpty()) {
            return false;
        }
        return true;
    }

    public static boolean isValidPassword(String password) {
        // Minimum 8 characters, at least one letter and one digit
        if (isNullOrEmpty(password) || password.length() < 8) {
            return false;
        }
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        return hasLetter && hasDigit;
    }

    public static boolean isValidPhoneNumber(String phoneNumber) {
        // phoneNumber is optional on User/Store, so null/empty is allowed here.
        // Only validate the format when a value is actually supplied.
        if (isNullOrEmpty(phoneNumber)) {
            return true;
        }
        return PHONE_PATTERN.matcher(phoneNumber).matches();
    }

    public static boolean isValidLatitude(double latitude) {
        return latitude >= -90.0 && latitude <= 90.0;
    }

    public static boolean isValidLongitude(double longitude) {
        return longitude >= -180.0 && longitude <= 180.0;
    }

    // ---------- Store Category ----------

    public static boolean isValidCategoryName(String name) {
        if (isNullOrEmpty(name) || name.length() > 100) {
            return false;
        }
        return true;
    }

    // ---------- Store ----------

    public static boolean isValidStoreName(String storeName) {
        if (isNullOrEmpty(storeName) || storeName.length() > 255) {
            return false;
        }
        return true;
    }

    public static boolean isValidOperatingHours(LocalTime openingTime, LocalTime closingTime) {
        // Closing time must be after opening time
        if (openingTime == null || closingTime == null) {
            return false;
        }
        return closingTime.isAfter(openingTime);
    }

    public static boolean isValidRatingAverage(double averageRating) {
        // Store.averageRating is a running average, so 0 (no reviews yet) is valid
        return averageRating >= 0.0 && averageRating <= 5.0;
    }

    // ---------- Promotion ----------

    public static boolean isValidPrice(double price) {
        if (price < 0) {
            return false;
        }
        return true;
    }

    public static boolean isValidDiscount(double originalPrice, double discountPrice) {
        // Discount price must be positive and cheaper than the original price
        if (!isValidPrice(originalPrice) || !isValidPrice(discountPrice)) {
            return false;
        }
        return discountPrice < originalPrice;
    }

    public static boolean isValidQuantity(int quantity) {
        if (quantity < 0) {
            return false;
        }
        return true;
    }

    public static boolean isValidPromotionPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        // endDate must be strictly after startDate
        if (startDate == null || endDate == null) {
            return false;
        }
        return endDate.isAfter(startDate);
    }

    // ---------- Review ----------

    public static boolean isValidRating(int rating) {
        // Review.rating is constrained BETWEEN 1 AND 5
        return rating >= 1 && rating <= 5;
    }

    // ---------- Admin User ----------

    public static boolean isValidAdminRole(String role) {
        if (isNullOrEmpty(role) || role.length() > 50) {
            return false;
        }
        return true;
    }

    // ---------- Shared / General ----------

    public static boolean isValidUUID(String id) {
        // Confirms a String is a properly formatted UUID before it's parsed/persisted
        if (isNullOrEmpty(id)) {
            return false;
        }
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static boolean isValidLength(String str, int maxLength) {
        // Generic guard for VARCHAR-bound fields (e.g. address(500), description)
        if (isNullOrEmpty(str)) {
            return false;
        }
        return str.length() <= maxLength;
    }
}