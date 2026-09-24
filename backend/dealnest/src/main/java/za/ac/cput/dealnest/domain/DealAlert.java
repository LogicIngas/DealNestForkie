package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "deal_alerts")
public class DealAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String alertID;

    @Enumerated(EnumType.STRING)
    private StoreCategory category;

    private String keyword;

    private Double minDiscountPercentage;

    private Double maxPrice;

    private Boolean active;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    protected DealAlert() {
    }

    public DealAlert(Builder builder) {
        this.alertID = builder.alertID;
        this.category = builder.category;
        this.keyword = builder.keyword;
        this.minDiscountPercentage = builder.minDiscountPercentage;
        this.maxPrice = builder.maxPrice;
        this.active = builder.active;
        this.createdAt = builder.createdAt;
        this.user = builder.user;
        this.store = builder.store;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (active == null) {
            active = true;
        }
    }

    public String getAlertID() {
        return alertID;
    }

    public StoreCategory getCategory() {
        return category;
    }

    public String getKeyword() {
        return keyword;
    }

    public Double getMinDiscountPercentage() {
        return minDiscountPercentage;
    }

    public Double getMaxPrice() {
        return maxPrice;
    }

    public Boolean getActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public User getUser() {
        return user;
    }

    public Store getStore() {
        return store;
    }

    public void setAlertID(String alertID) {
        this.alertID = alertID;
    }

    public void setCategory(StoreCategory category) {
        this.category = category;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public void setMinDiscountPercentage(Double minDiscountPercentage) {
        this.minDiscountPercentage = minDiscountPercentage;
    }

    public void setMaxPrice(Double maxPrice) {
        this.maxPrice = maxPrice;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public boolean matches(Promotion promotion) {
        if (promotion == null || promotion.getStore() == null) return false;
        if (store != null && !store.getStoreId().equals(promotion.getStore().getStoreId())) return false;
        if (category != null && !category.equals(promotion.getStore().getCategory())) return false;
        if (maxPrice != null && (promotion.getDiscountPrice() == null || promotion.getDiscountPrice() > maxPrice)) return false;
        if (minDiscountPercentage != null && (promotion.getDiscountPercentage() == null || promotion.getDiscountPercentage() < minDiscountPercentage)) {
            return false;
        }
        if (keyword != null && !keyword.isBlank()) {
            String term = keyword.trim().toLowerCase();
            boolean titleMatch = promotion.getTitle() != null && promotion.getTitle().toLowerCase().contains(term);
            boolean storeMatch = promotion.getStore().getStoreName() != null
                    && promotion.getStore().getStoreName().toLowerCase().contains(term);
            if (!titleMatch && !storeMatch) return false;
        }
        return true;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        DealAlert dealAlert = (DealAlert) o;
        return Objects.equals(alertID, dealAlert.alertID) &&
                Objects.equals(user, dealAlert.user) &&
                Objects.equals(store, dealAlert.store);
    }

    @Override
    public int hashCode() {
        return Objects.hash(alertID, user, store);
    }

    @Override
    public String toString() {
        return "DealAlert{" +
                "alertID='" + alertID + '\'' +
                ", category=" + category +
                ", keyword='" + keyword + '\'' +
                ", minDiscountPercentage=" + minDiscountPercentage +
                ", maxPrice=" + maxPrice +
                ", active=" + active +
                '}';
    }

    public static class Builder {
        private String alertID;
        private StoreCategory category;
        private String keyword;
        private Double minDiscountPercentage;
        private Double maxPrice;
        private Boolean active;
        private LocalDateTime createdAt;
        private User user;
        private Store store;

        public Builder setAlertID(String alertID) {
            this.alertID = alertID;
            return this;
        }

        public Builder setCategory(StoreCategory category) {
            this.category = category;
            return this;
        }

        public Builder setKeyword(String keyword) {
            this.keyword = keyword;
            return this;
        }

        public Builder setMinDiscountPercentage(Double minDiscountPercentage) {
            this.minDiscountPercentage = minDiscountPercentage;
            return this;
        }

        public Builder setMaxPrice(Double maxPrice) {
            this.maxPrice = maxPrice;
            return this;
        }

        public Builder setActive(Boolean active) {
            this.active = active;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder setStore(Store store) {
            this.store = store;
            return this;
        }

        public Builder copy(DealAlert dealAlert) {
            this.alertID = dealAlert.alertID;
            this.category = dealAlert.category;
            this.keyword = dealAlert.keyword;
            this.minDiscountPercentage = dealAlert.minDiscountPercentage;
            this.maxPrice = dealAlert.maxPrice;
            this.active = dealAlert.active;
            this.createdAt = dealAlert.createdAt;
            this.user = dealAlert.user;
            this.store = dealAlert.store;
            return this;
        }

        public DealAlert build() {
            return new DealAlert(this);
        }
    }
}