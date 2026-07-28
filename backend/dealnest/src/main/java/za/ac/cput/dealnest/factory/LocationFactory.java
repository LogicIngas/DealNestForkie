package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.Location;
import za.ac.cput.dealnest.util.Helper;

public class LocationFactory {

    public static Location createLocation(String address, String city, double latitude, double longitude) {
        if (Helper.isNullOrEmpty(address) || Helper.isNullOrEmpty(city) ||
            !Helper.isValidLatitude(latitude) || !Helper.isValidLongitude(longitude)) {
            return null;
        }

        return new Location.Builder()
                .setAddress(address)
                .setCity(city)
                .setLatitude(latitude)
                .setLongitude(longitude)
                .build();
    }
}
