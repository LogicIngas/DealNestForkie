package za.ac.cput.dealnest.dto;

import java.time.LocalDateTime;

/**
 * One recorded price for one deal: the three columns a price history graph reads.
 *
 * <p>Selected straight out of the database by IPricePointRepository's @Query
 * expressions, so it has to stay a constructor expression target with a public
 * (String, Double, LocalDateTime) constructor in that exact order. Adding a field
 * means changing both queries to match.
 *
 * <p>Deliberately not the PricePoint entity: the entity carries a lazy Promotion
 * association, and hydrating whole entities just to draw a line would drag a
 * follow-up query per point for data nothing reads.
 */
public class PricePointDTO {

    private String promotionID;
    private Double price;
    private LocalDateTime recordedAt;

    public PricePointDTO() {
    }

    public PricePointDTO(String promotionID, Double price, LocalDateTime recordedAt) {
        this.promotionID = promotionID;
        this.price = price;
        this.recordedAt = recordedAt;
    }

    public String getPromotionID() {
        return promotionID;
    }

    public void setPromotionID(String promotionID) {
        this.promotionID = promotionID;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    @Override
    public String toString() {
        return "PricePointDTO{" +
                "promotionID='" + promotionID + '\'' +
                ", price=" + price +
                ", recordedAt=" + recordedAt +
                '}';
    }
}
