package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;
import java.util.UUID;

@Entity
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID storeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryId", nullable = false)
    private StoreCategory category;

    private String storeName;
    private String description;
    private String email;
    private String phoneNumber;
    private String address;
    private String city;
    private double latitude;
    private double longitude;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Boolean isVerified;
    private Boolean isActive;
    private Double averageRating;
    private int totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Store(Builder builder) {
        this.storeId = builder.storeId;
        this.category = builder.category;
        this.storeName = builder.storeName;
        this.description = builder.description;
        this.email = builder.email;
        this.phoneNumber = builder.phoneNumber;
        this.address = builder.address;
        this.city = builder.city;
        this.latitude = builder.latitude;
        this.longitude = builder.longitude;
        this.openingTime = builder.openingTime;
        this.closingTime = builder.closingTime;
        this.isVerified = builder.isVerified;
        this.isActive = builder.isActive;
        this.averageRating = builder.averageRating;
        this.totalReviews = builder.totalReviews;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
    }

    protected Store() {
    }

    public UUID getStoreId() {
        return storeId;
    }

    public StoreCategory getCategory() {
        return category;
    }

    public String getStoreName() {
        return storeName;
    }

    public String getDescription() {
        return description;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public Boolean getVerified() {
        return isVerified;
    }

    public Boolean getActive() {
        return isActive;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Store store = (Store) o;
        return Double.compare(latitude, store.latitude) == 0 && Double.compare(longitude, store.longitude) == 0 && totalReviews == store.totalReviews && Objects.equals(storeId, store.storeId) && Objects.equals(category, store.category) && Objects.equals(storeName, store.storeName) && Objects.equals(description, store.description) && Objects.equals(email, store.email) && Objects.equals(phoneNumber, store.phoneNumber) && Objects.equals(address, store.address) && Objects.equals(city, store.city) && Objects.equals(openingTime, store.openingTime) && Objects.equals(closingTime, store.closingTime) && Objects.equals(isVerified, store.isVerified) && Objects.equals(isActive, store.isActive) && Objects.equals(averageRating, store.averageRating) && Objects.equals(createdAt, store.createdAt) && Objects.equals(updatedAt, store.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(storeId, category, storeName, description, email, phoneNumber, address, city, latitude, longitude, openingTime, closingTime, isVerified, isActive, averageRating, totalReviews, createdAt, updatedAt);
    }

    @Override
    public String toString() {
        return "Store{" +
                "storeId=" + storeId +
                ", category=" + category +
                ", storeName='" + storeName + '\'' +
                ", description='" + description + '\'' +
                ", email='" + email + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", address='" + address + '\'' +
                ", city='" + city + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", openingTime=" + openingTime +
                ", closingTime=" + closingTime +
                ", isVerified=" + isVerified +
                ", isActive=" + isActive +
                ", averageRating=" + averageRating +
                ", totalReviews=" + totalReviews +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    public static class Builder{
        private UUID storeId;
        private StoreCategory category;
        private String storeName;
        private String description;
        private String email;
        private String phoneNumber;
        private String address;
        private String city;
        private double latitude;
        private double longitude;
        private LocalTime openingTime;
        private LocalTime closingTime;
        private Boolean isVerified;
        private Boolean isActive;
        private Double averageRating;
        private int totalReviews;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder setStoreId(UUID storeId) {
            this.storeId = storeId;
            return this;
        }

        public Builder setCategory(StoreCategory category) {
            this.category = category;
            return this;
        }

        public Builder setStoreName(String storeName) {
            this.storeName = storeName;
            return this;
        }

        public Builder setDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
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

        public Builder setLatitude(double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder setLongitude(double longitude) {
            this.longitude = longitude;
            return this;
        }

        public Builder setOpeningTime(LocalTime openingTime) {
            this.openingTime = openingTime;
            return this;
        }

        public Builder setClosingTime(LocalTime closingTime) {
            this.closingTime = closingTime;
            return this;
        }

        public Builder setVerified(Boolean verified) {
            isVerified = verified;
            return this;
        }

        public Builder setActive(Boolean active) {
            isActive = active;
            return this;
        }

        public Builder setAverageRating(Double averageRating) {
            this.averageRating = averageRating;
            return this;
        }

        public Builder setTotalReviews(int totalReviews) {
            this.totalReviews = totalReviews;
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

        public Builder copy(Store store) {
            this.storeId = store.storeId;
            this.category = store.category;
            this.storeName = store.storeName;
            this.description = store.description;
            this.email = store.email;
            this.phoneNumber = store.phoneNumber;
            this.address = store.address;
            this.city = store.city;
            this.latitude = store.latitude;
            this.longitude = store.longitude;
            this.openingTime = store.openingTime;
            this.closingTime = store.closingTime;
            this.isVerified = store.isVerified;
            this.isActive = store.isActive;
            this.averageRating = store.averageRating;
            this.totalReviews = store.totalReviews;
            this.createdAt = store.createdAt;
            this.updatedAt = store.updatedAt;
            return this;
        }

        public Store build() {
            return new Store(this);
        }
    }
}
