package za.ac.cput.dealnest.factory;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.util.Helper;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public class StoreFactory {

    public static Store createStore( StoreCategory category,String storeName,String description,
                                    String email,String phoneNumber,String address,String city,
                                    double latitude,double longitude,LocalTime openingTime,
                                    LocalTime closingTime,Boolean isVerified,Boolean isActive,
                                    Double averageRating,int totalReviews,LocalDateTime createdAt,
                                    LocalDateTime updatedAt) {

        if (Helper.isNullOrEmpty(storeName)
                || Helper.isNullOrEmpty(email) || Helper.isNullOrEmpty(phoneNumber)
                || !Helper.isValidStoreName(storeName)
                || !Helper.isValidEmail(email) || !Helper.isValidNumber(Float.parseFloat(phoneNumber))
                || !Helper.isValidLatitude(latitude) || !Helper.isValidLongitude(longitude)
                || !Helper.isValidOperatingHours(openingTime, closingTime) || !Helper.isValidRatingAverage(averageRating)
                || !Helper.isValidRating(totalReviews)
        ) {
            return null;
        }


        return new Store.Builder()
                .setCategory(category)
                .setStoreName(storeName)
                .setDescription(description)
                .setEmail(email)
                .setPhoneNumber(phoneNumber)
                .setAddress(address)
                .setCity(city)
                .setLatitude(latitude)
                .setLongitude(longitude)
                .setOpeningTime(openingTime)
                .setClosingTime(closingTime)
                .setVerified(isVerified)
                .setActive(isActive)
                .setAverageRating(averageRating)
                .setTotalReviews(totalReviews)
                .setCreatedAt(createdAt)
                .setUpdatedAt(updatedAt)
                .build();
    }
}
