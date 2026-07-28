package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "locations")
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String locationID;

    private double latitude;
    private double longitude;
    private String address;
    private String city;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    protected Location() {
    }

    public Location(Builder builder) {
        this.locationID = builder.locationID;
        this.latitude = builder.latitude;
        this.longitude = builder.longitude;
        this.address = builder.address;
        this.city = builder.city;
        this.user = builder.user;
    }

    public String getLocationID() {
        return locationID;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public User getUser() {
        return user;
    }

    public double calculateDistance(double lat2, double lon2) {
        double R = 6371;
        double lat1Rad = Math.toRadians(this.latitude);
        double lat2Rad = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - this.latitude);
        double deltaLon = Math.toRadians(lon2 - this.longitude);

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Location location = (Location) o;
        return Double.compare(latitude, location.latitude) == 0 &&
               Double.compare(longitude, location.longitude) == 0 &&
               Objects.equals(locationID, location.locationID) &&
               Objects.equals(address, location.address) &&
               Objects.equals(city, location.city);
    }

    @Override
    public int hashCode() {
        return Objects.hash(locationID, latitude, longitude, address, city);
    }

    @Override
    public String toString() {
        return "Location{" +
                "locationID='" + locationID + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", address='" + address + '\'' +
                ", city='" + city + '\'' +
                '}';
    }

    public static class Builder {
        private String locationID;
        private double latitude;
        private double longitude;
        private String address;
        private String city;
        private User user;

        public Builder setLocationID(String locationID) {
            this.locationID = locationID;
            return this;
        }

        public Builder setLatitude(double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder setLongitude(double longitude) {
            this.longitude = longitude;
            return this;
        }

        public Builder setAddress(String address) {
            this.address = address;
            return this;
        }

        public Builder setCity(String city) {
            this.city = city;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder copy(Location location) {
            this.locationID = location.locationID;
            this.latitude = location.latitude;
            this.longitude = location.longitude;
            this.address = location.address;
            this.city = location.city;
            this.user = location.user;
            return this;
        }

        public Location build() {
            return new Location(this);
        }
    }
}
