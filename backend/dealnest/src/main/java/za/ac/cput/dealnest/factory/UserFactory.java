package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.util.Helper;
import java.time.LocalDateTime;

public class UserFactory {

    public static User createUser(String email,String password,String firstName,
                                  String lastName,String phoneNumber,double latitude,double longitude,
                                  boolean isActive,LocalDateTime createdAt,LocalDateTime updatedAt){

        if(Helper.isNullOrEmpty(email) || Helper.isNullOrEmpty(password) ||
           Helper.isNullOrEmpty(firstName) || Helper.isNullOrEmpty(lastName) || Helper.isNullOrEmpty(phoneNumber) ||
           !Helper.isValidEmail(email) || !Helper.isValidName(firstName) ||
           !Helper.isValidName(lastName) || !Helper.isValidPhoneNumber(phoneNumber) || !Helper.isValidLatitude(latitude) ||
           !Helper.isValidLongitude(longitude)
        ){
            return null;
        }
        return new User.Builder()
                .setEmail(email)
                .setPassword(password)
                .setFirstName(firstName)
                .setLastName(lastName)
                .setPhoneNumber(phoneNumber)
                .setLatitude(latitude)
                .setLongitude(longitude)
                .setActive(isActive)
                .setCreatedAt(createdAt)
                .setUpdatedAt(updatedAt)
                .build();
    }
}
