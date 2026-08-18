package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "price_points")
public class PricePoint {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String pricePointID;

    @Column(nullable = false)
    private Double price;

    private LocalDateTime recordedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    protected PricePoint() {
    }

    public PricePoint(Builder builder) {
        this.pricePointID = builder.pricePointID;
        this.price = builder.price;
        this.recordedAt = builder.recordedAt;
        this.promotion = builder.promotion;
    }

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }

    public String getPricePointID() {
        return pricePointID;
    }

    public Double getPrice() {
        return price;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public void setPricePointID(String pricePointID) {
        this.pricePointID = pricePointID;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public void setPromotion(Promotion promotion) {
        this.promotion = promotion;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        PricePoint that = (PricePoint) o;
        return Objects.equals(pricePointID, that.pricePointID) &&
               Objects.equals(price, that.price) &&
               Objects.equals(promotion, that.promotion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pricePointID, price, promotion);
    }

    @Override
    public String toString() {
        return "PricePoint{" +
                "pricePointID='" + pricePointID + '\'' +
                ", price=" + price +
                ", recordedAt=" + recordedAt +
                '}';
    }

    public static class Builder {
        private String pricePointID;
        private Double price;
        private LocalDateTime recordedAt;
        private Promotion promotion;

        public Builder setPricePointID(String pricePointID) {
            this.pricePointID = pricePointID;
            return this;
        }

        public Builder setPrice(Double price) {
            this.price = price;
            return this;
        }

        public Builder setRecordedAt(LocalDateTime recordedAt) {
            this.recordedAt = recordedAt;
            return this;
        }

        public Builder setPromotion(Promotion promotion) {
            this.promotion = promotion;
            return this;
        }

        public Builder copy(PricePoint pricePoint) {
            this.pricePointID = pricePoint.pricePointID;
            this.price = pricePoint.price;
            this.recordedAt = pricePoint.recordedAt;
            this.promotion = pricePoint.promotion;
            return this;
        }

        public PricePoint build() {
            return new PricePoint(this);
        }
    }
}
