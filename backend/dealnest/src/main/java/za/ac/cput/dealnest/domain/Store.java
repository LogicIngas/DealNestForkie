package za.ac.cput.dealnest.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "stores")
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String storeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
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
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private StorePlanTier planTier;

    private LocalDateTime planRenewsAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Promotion> promotions = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteStore> favoriteStores = new ArrayList<>();

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
        this.imageUrl = builder.imageUrl;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
        this.user = builder.user;
        this.promotions = builder.promotions;
        this.reviews = builder.reviews;
        this.favoriteStores = builder.favoriteStores;
        this.planTier = builder.planTier;
        this.planRenewsAt = builder.planRenewsAt;
    }

    protected Store() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
        if (isVerified == null) {
            isVerified = false;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (planTier == null) {
            planTier = StorePlanTier.FREE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getStoreId() {
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

    public String getImageUrl() {
        return imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public User getUser() {
        return user;
    }

    public List<Promotion> getPromotions() {
        return promotions;
    }

    public List<Review> getReviews() {
        return reviews;
    }

    public List<FavoriteStore> getFavoriteStores() {
        return favoriteStores;
    }

    public StorePlanTier getPlanTier() {
        return planTier;
    }

    public LocalDateTime getPlanRenewsAt() {
        return planRenewsAt;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public void setCategory(StoreCategory category) {
        this.category = category;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public void setOpeningTime(LocalTime openingTime) {
        this.openingTime = openingTime;
    }

    public void setClosingTime(LocalTime closingTime) {
        this.closingTime = closingTime;
    }

    public void setVerified(Boolean verified) {
        isVerified = verified;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setPlanTier(StorePlanTier planTier) {
        this.planTier = planTier;
    }

    public void setPlanRenewsAt(LocalDateTime planRenewsAt) {
        this.planRenewsAt = planRenewsAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Store store = (Store) o;
        return Double.compare(latitude, store.latitude) == 0 && Double.compare(longitude, store.longitude) == 0 && totalReviews == store.totalReviews && Objects.equals(storeId, store.storeId) && Objects.equals(category, store.category) && Objects.equals(storeName, store.storeName) && Objects.equals(description, store.description) && Objects.equals(email, store.email) && Objects.equals(phoneNumber, store.phoneNumber) && Objects.equals(address, store.address) && Objects.equals(city, store.city) && Objects.equals(openingTime, store.openingTime) && Objects.equals(closingTime, store.closingTime) && Objects.equals(isVerified, store.isVerified) && Objects.equals(isActive, store.isActive) && Objects.equals(averageRating, store.averageRating) && Objects.equals(imageUrl, store.imageUrl) && Objects.equals(createdAt, store.createdAt) && Objects.equals(updatedAt, store.updatedAt) && planTier == store.planTier && Objects.equals(planRenewsAt, store.planRenewsAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(storeId, category, storeName, description, email, phoneNumber, address, city, latitude, longitude, openingTime, closingTime, isVerified, isActive, averageRating, totalReviews, imageUrl, createdAt, updatedAt, planTier, planRenewsAt);
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
                ", imageUrl='" + imageUrl + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", planTier=" + planTier +
                ", planRenewsAt=" + planRenewsAt +
                '}';
    }

    public static class Builder{
        private String storeId;
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
        private String imageUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private User user;
        private List<Promotion> promotions = new ArrayList<>();
        private List<Review> reviews = new ArrayList<>();
        private List<FavoriteStore> favoriteStores = new ArrayList<>();
        private StorePlanTier planTier;
        private LocalDateTime planRenewsAt;

        public Builder setStoreId(String storeId) {
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

        public Builder setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
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

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder setPromotions(List<Promotion> promotions) {
            this.promotions = promotions;
            return this;
        }

        public Builder setReviews(List<Review> reviews) {
            this.reviews = reviews;
            return this;
        }

        public Builder setFavoriteStores(List<FavoriteStore> favoriteStores) {
            this.favoriteStores = favoriteStores;
            return this;
        }

        public Builder setPlanTier(StorePlanTier planTier) {
            this.planTier = planTier;
            return this;
        }

        public Builder setPlanRenewsAt(LocalDateTime planRenewsAt) {
            this.planRenewsAt = planRenewsAt;
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
            this.imageUrl = store.imageUrl;
            this.createdAt = store.createdAt;
            this.updatedAt = store.updatedAt;
            this.user = store.user;
            this.promotions = store.promotions;
            this.reviews = store.reviews;
            this.favoriteStores = store.favoriteStores;
            this.planTier = store.planTier;
            this.planRenewsAt = store.planRenewsAt;
            return this;
        }

        public Store build() {
            return new Store(this);
        }
    }
}
