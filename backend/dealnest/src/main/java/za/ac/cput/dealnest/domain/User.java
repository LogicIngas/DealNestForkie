package za.ac.cput.dealnest.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userID;

    @Column(unique = true)
    private String email;

    private String password;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private double latitude;
    private double longitude;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Store> stores = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Location location;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedPromotion> savedPromotions = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteStore> favoriteStores = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SearchHistory> searchHistories = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications = new ArrayList<>();

    protected User() {
    }

    public User(Builder builder) {
        this.userID = builder.userID;
        this.email = builder.email;
        this.password = builder.password;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.phoneNumber = builder.phoneNumber;
        this.latitude = builder.latitude;
        this.longitude = builder.longitude;
        this.isActive = builder.isActive;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
        this.stores = builder.stores;
        this.location = builder.location;
        this.savedPromotions = builder.savedPromotions;
        this.favoriteStores = builder.favoriteStores;
        this.searchHistories = builder.searchHistories;
        this.notifications = builder.notifications;
    }

    public String getUserID() {
        return userID;
    }

    public String getEmail() {
        return email;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<Store> getStores() {
        return stores;
    }

    public Location getLocation() {
        return location;
    }

    public List<SavedPromotion> getSavedPromotions() {
        return savedPromotions;
    }

    public List<FavoriteStore> getFavoriteStores() {
        return favoriteStores;
    }

    public List<SearchHistory> getSearchHistories() {
        return searchHistories;
    }

    public List<Notification> getNotifications() {
        return notifications;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    @JsonProperty("isActive")
    public void setActive(boolean active) {
        isActive = active;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Double.compare(latitude, user.latitude) == 0 && Double.compare(longitude, user.longitude) == 0 && isActive == user.isActive && Objects.equals(userID, user.userID) && Objects.equals(email, user.email) && Objects.equals(password, user.password) && Objects.equals(firstName, user.firstName) && Objects.equals(lastName, user.lastName) && Objects.equals(phoneNumber, user.phoneNumber) && Objects.equals(createdAt, user.createdAt) && Objects.equals(updatedAt, user.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userID, email, password, firstName, lastName, phoneNumber, latitude, longitude, isActive, createdAt, updatedAt);
    }

    @Override
    public String toString() {
        return "User{" +
                "userID='" + userID + '\'' +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    public static class Builder{
        private String userID;
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private double latitude;
        private double longitude;
        private boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<Store> stores = new ArrayList<>();
        private Location location;
        private List<SavedPromotion> savedPromotions = new ArrayList<>();
        private List<FavoriteStore> favoriteStores = new ArrayList<>();
        private List<SearchHistory> searchHistories = new ArrayList<>();
        private List<Notification> notifications = new ArrayList<>();

        public Builder setUserID(String userID) {
            this.userID = userID;
            return this;
        }

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder setPassword(String password) {
            this.password = password;
            return this;
        }

        public Builder setFirstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder setLastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
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

        public Builder setActive(boolean active) {
            isActive = active;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder setStores(List<Store> stores) {
            this.stores = stores;
            return this;
        }

        public Builder setLocation(Location location) {
            this.location = location;
            return this;
        }

        public Builder setSavedPromotions(List<SavedPromotion> savedPromotions) {
            this.savedPromotions = savedPromotions;
            return this;
        }

        public Builder setFavoriteStores(List<FavoriteStore> favoriteStores) {
            this.favoriteStores = favoriteStores;
            return this;
        }

        public Builder setSearchHistories(List<SearchHistory> searchHistories) {
            this.searchHistories = searchHistories;
            return this;
        }

        public Builder setNotifications(List<Notification> notifications) {
            this.notifications = notifications;
            return this;
        }

        public Builder copy(User user) {
            this.userID = user.userID;
            this.email = user.email;
            this.password = user.password;
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.phoneNumber = user.phoneNumber;
            this.latitude = user.latitude;
            this.longitude = user.longitude;
            this.isActive = user.isActive;
            this.createdAt = user.createdAt;
            this.updatedAt = user.updatedAt;
            this.stores = user.stores;
            this.location = user.location;
            this.savedPromotions = user.savedPromotions;
            this.favoriteStores = user.favoriteStores;
            this.searchHistories = user.searchHistories;
            this.notifications = user.notifications;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}
