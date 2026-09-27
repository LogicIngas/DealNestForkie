package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "redemptions")
public class Redemption {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String redemptionID;

    @Column(unique = true)
    private String code;

    private Boolean redeemed;
    private LocalDateTime claimedAt;
    private LocalDateTime redeemedAt;
    /** Last time this voucher was emailed on the user's request, for the resend cooldown. */
    private LocalDateTime emailedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected Redemption() {
    }

    public Redemption(Builder builder) {
        this.redemptionID = builder.redemptionID;
        this.code = builder.code;
        this.redeemed = builder.redeemed;
        this.claimedAt = builder.claimedAt;
        this.redeemedAt = builder.redeemedAt;
        this.emailedAt = builder.emailedAt;
        this.promotion = builder.promotion;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (claimedAt == null) {
            claimedAt = LocalDateTime.now();
        }
        if (redeemed == null) {
            redeemed = false;
        }
    }

    public String getRedemptionID() {
        return redemptionID;
    }

    public String getCode() {
        return code;
    }

    public Boolean getRedeemed() {
        return redeemed;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public LocalDateTime getRedeemedAt() {
        return redeemedAt;
    }

    public LocalDateTime getEmailedAt() {
        return emailedAt;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public User getUser() {
        return user;
    }

    public void setRedemptionID(String redemptionID) {
        this.redemptionID = redemptionID;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setRedeemed(Boolean redeemed) {
        this.redeemed = redeemed;
    }

    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }

    public void setRedeemedAt(LocalDateTime redeemedAt) {
        this.redeemedAt = redeemedAt;
    }

    public void setEmailedAt(LocalDateTime emailedAt) {
        this.emailedAt = emailedAt;
    }

    public void setPromotion(Promotion promotion) {
        this.promotion = promotion;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Redemption that = (Redemption) o;
        return Objects.equals(redemptionID, that.redemptionID) &&
               Objects.equals(code, that.code) &&
               Objects.equals(user, that.user) &&
               Objects.equals(promotion, that.promotion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(redemptionID, code, user, promotion);
    }

    @Override
    public String toString() {
        return "Redemption{" +
                "redemptionID='" + redemptionID + '\'' +
                ", code='" + code + '\'' +
                ", redeemed=" + redeemed +
                ", claimedAt=" + claimedAt +
                ", redeemedAt=" + redeemedAt +
                '}';
    }

    public static class Builder {
        private String redemptionID;
        private String code;
        private Boolean redeemed;
        private LocalDateTime claimedAt;
        private LocalDateTime redeemedAt;
        private LocalDateTime emailedAt;
        private Promotion promotion;
        private User user;

        public Builder setRedemptionID(String redemptionID) {
            this.redemptionID = redemptionID;
            return this;
        }

        public Builder setCode(String code) {
            this.code = code;
            return this;
        }

        public Builder setRedeemed(Boolean redeemed) {
            this.redeemed = redeemed;
            return this;
        }

        public Builder setClaimedAt(LocalDateTime claimedAt) {
            this.claimedAt = claimedAt;
            return this;
        }

        public Builder setRedeemedAt(LocalDateTime redeemedAt) {
            this.redeemedAt = redeemedAt;
            return this;
        }

        public Builder setEmailedAt(LocalDateTime emailedAt) {
            this.emailedAt = emailedAt;
            return this;
        }

        public Builder setPromotion(Promotion promotion) {
            this.promotion = promotion;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder copy(Redemption redemption) {
            this.redemptionID = redemption.redemptionID;
            this.code = redemption.code;
            this.redeemed = redemption.redeemed;
            this.claimedAt = redemption.claimedAt;
            this.redeemedAt = redemption.redeemedAt;
            this.emailedAt = redemption.emailedAt;
            this.promotion = redemption.promotion;
            this.user = redemption.user;
            return this;
        }

        public Redemption build() {
            return new Redemption(this);
        }
    }
}
