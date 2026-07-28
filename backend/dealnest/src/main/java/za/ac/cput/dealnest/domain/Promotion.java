package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String promotionID;

    private String title;
    private String description;
    private Double originalPrice;
    private Double discountPrice;
    private Double discountPercentage;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedPromotion> savedPromotions = new ArrayList<>();

    protected Promotion() {
    }

    public Promotion(Builder builder) {
        this.promotionID = builder.promotionID;
        this.title = builder.title;
        this.description = builder.description;
        this.originalPrice = builder.originalPrice;
        this.discountPrice = builder.discountPrice;
        this.discountPercentage = builder.discountPercentage;
        this.startDate = builder.startDate;
        this.endDate = builder.endDate;
        this.isActive = builder.isActive;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
        this.store = builder.store;
        this.savedPromotions = builder.savedPromotions;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getPromotionID() {
        return promotionID;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public Double getDiscountPrice() {
        return discountPrice;
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public Boolean getActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Store getStore() {
        return store;
    }

    public List<SavedPromotion> getSavedPromotions() {
        return savedPromotions;
    }

    public Double calculateDiscount() {
        if (originalPrice == null || discountPrice == null) {
            return 0.0;
        }
        return originalPrice - discountPrice;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endDate);
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Promotion promotion = (Promotion) o;
        return Objects.equals(promotionID, promotion.promotionID) &&
               Objects.equals(title, promotion.title) &&
               Objects.equals(originalPrice, promotion.originalPrice) &&
               Objects.equals(discountPrice, promotion.discountPrice);
    }

    @Override
    public int hashCode() {
        return Objects.hash(promotionID, title, originalPrice, discountPrice);
    }

    @Override
    public String toString() {
        return "Promotion{" +
                "promotionID='" + promotionID + '\'' +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", originalPrice=" + originalPrice +
                ", discountPrice=" + discountPrice +
                ", discountPercentage=" + discountPercentage +
                ", isActive=" + isActive +
                '}';
    }

    public static class Builder {
        private String promotionID;
        private String title;
        private String description;
        private Double originalPrice;
        private Double discountPrice;
        private Double discountPercentage;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Store store;
        private List<SavedPromotion> savedPromotions = new ArrayList<>();

        public Builder setPromotionID(String promotionID) {
            this.promotionID = promotionID;
            return this;
        }

        public Builder setTitle(String title) {
            this.title = title;
            return this;
        }

        public Builder setDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder setOriginalPrice(Double originalPrice) {
            this.originalPrice = originalPrice;
            return this;
        }

        public Builder setDiscountPrice(Double discountPrice) {
            this.discountPrice = discountPrice;
            return this;
        }

        public Builder setDiscountPercentage(Double discountPercentage) {
            this.discountPercentage = discountPercentage;
            return this;
        }

        public Builder setStartDate(LocalDateTime startDate) {
            this.startDate = startDate;
            return this;
        }

        public Builder setEndDate(LocalDateTime endDate) {
            this.endDate = endDate;
            return this;
        }

        public Builder setActive(Boolean active) {
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

        public Builder setStore(Store store) {
            this.store = store;
            return this;
        }

        public Builder setSavedPromotions(List<SavedPromotion> savedPromotions) {
            this.savedPromotions = savedPromotions;
            return this;
        }

        public Builder copy(Promotion promotion) {
            this.promotionID = promotion.promotionID;
            this.title = promotion.title;
            this.description = promotion.description;
            this.originalPrice = promotion.originalPrice;
            this.discountPrice = promotion.discountPrice;
            this.discountPercentage = promotion.discountPercentage;
            this.startDate = promotion.startDate;
            this.endDate = promotion.endDate;
            this.isActive = promotion.isActive;
            this.createdAt = promotion.createdAt;
            this.updatedAt = promotion.updatedAt;
            this.store = promotion.store;
            this.savedPromotions = promotion.savedPromotions;
            return this;
        }

        public Promotion build() {
            return new Promotion(this);
        }
    }
}
