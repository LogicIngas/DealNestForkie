package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "saved_promotions")
public class SavedPromotion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String savedPromotionID;

    private LocalDateTime savedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    protected SavedPromotion() {
    }

    public SavedPromotion(Builder builder) {
        this.savedPromotionID = builder.savedPromotionID;
        this.savedDate = builder.savedDate;
        this.user = builder.user;
        this.promotion = builder.promotion;
    }

    @PrePersist
    protected void onCreate() {
        if (savedDate == null) {
            savedDate = LocalDateTime.now();
        }
    }

    public String getSavedPromotionID() {
        return savedPromotionID;
    }

    public LocalDateTime getSavedDate() {
        return savedDate;
    }

    public User getUser() {
        return user;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public void save() {
        this.savedDate = LocalDateTime.now();
    }

    public void unsave() {
        // Mark as deleted - could use a soft delete approach
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        SavedPromotion that = (SavedPromotion) o;
        return Objects.equals(savedPromotionID, that.savedPromotionID) &&
               Objects.equals(user, that.user) &&
               Objects.equals(promotion, that.promotion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(savedPromotionID, user, promotion);
    }

    @Override
    public String toString() {
        return "SavedPromotion{" +
                "savedPromotionID='" + savedPromotionID + '\'' +
                ", savedDate=" + savedDate +
                '}';
    }

    public static class Builder {
        private String savedPromotionID;
        private LocalDateTime savedDate;
        private User user;
        private Promotion promotion;

        public Builder setSavedPromotionID(String savedPromotionID) {
            this.savedPromotionID = savedPromotionID;
            return this;
        }

        public Builder setSavedDate(LocalDateTime savedDate) {
            this.savedDate = savedDate;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder setPromotion(Promotion promotion) {
            this.promotion = promotion;
            return this;
        }

        public Builder copy(SavedPromotion savedPromotion) {
            this.savedPromotionID = savedPromotion.savedPromotionID;
            this.savedDate = savedPromotion.savedDate;
            this.user = savedPromotion.user;
            this.promotion = savedPromotion.promotion;
            return this;
        }

        public SavedPromotion build() {
            return new SavedPromotion(this);
        }
    }
}
