package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String reviewID;

    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    protected Review() {
    }

    public Review(Builder builder) {
        this.reviewID = builder.reviewID;
        this.rating = builder.rating;
        this.comment = builder.comment;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
        this.store = builder.store;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getReviewID() {
        return reviewID;
    }

    public Integer getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
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

    public User getUser() {
        return user;
    }

    public void setReviewID(String reviewID) {
        this.reviewID = reviewID;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void editReview(String newComment, Integer newRating) {
        this.comment = newComment;
        this.rating = newRating;
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Review review = (Review) o;
        return Objects.equals(reviewID, review.reviewID) &&
               Objects.equals(rating, review.rating) &&
               Objects.equals(store, review.store);
    }

    @Override
    public int hashCode() {
        return Objects.hash(reviewID, rating, store);
    }

    @Override
    public String toString() {
        return "Review{" +
                "reviewID='" + reviewID + '\'' +
                ", rating=" + rating +
                ", comment='" + comment + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private String reviewID;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Store store;
        private User user;

        public Builder setReviewID(String reviewID) {
            this.reviewID = reviewID;
            return this;
        }

        public Builder setRating(Integer rating) {
            this.rating = rating;
            return this;
        }

        public Builder setComment(String comment) {
            this.comment = comment;
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

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder copy(Review review) {
            this.reviewID = review.reviewID;
            this.rating = review.rating;
            this.comment = review.comment;
            this.createdAt = review.createdAt;
            this.updatedAt = review.updatedAt;
            this.store = review.store;
            this.user = review.user;
            return this;
        }

        public Review build() {
            return new Review(this);
        }
    }
}
