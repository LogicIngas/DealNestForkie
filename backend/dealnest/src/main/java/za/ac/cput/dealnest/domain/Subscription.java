package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * A plan subscription paid for through DealNest's own card path. The plan tier still
 * lives on the User/Store rows (that's what the plus/pro feature gates read), while
 * this record keeps the agreed amount, enough of the card to identify it on a
 * receipt, and the lifecycle so the scheduler can downgrade the plan when a
 * subscription lapses or is cancelled.
 *
 * <p>There is deliberately no field for a card number. Only the scheme and the last
 * four digits are kept, because that is all a receipt needs; the number itself is
 * never written down anywhere.
 */
@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String subscriptionID;

    /** The User.userID or Store.storeId the subscription belongs to. */
    private String accountId;

    @Enumerated(EnumType.STRING)
    private SubscriptionAccountType accountType;

    /** Plan granted while active: PLUS for users, PRO for stores. */
    private String planKey;

    /** CARD = paid by card, EFT = one-off 30-day payment. */
    @Enumerated(EnumType.STRING)
    private SubscriptionPaymentMethod paymentMethod;

    /** Agreed monthly amount in ZAR cents (4900 = R49.00, 19900 = R199.00). */
    private long amountCents;

    private String currency;

    /** Scheme the card was issued by, for the receipt. Never the number. */
    private String cardBrand;

    /** Final four digits of the card, for the receipt. Never the number. */
    private String cardLast4;

    /** Authorisation reference for the payment that started this subscription. */
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    private SubscriptionStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime startsAt;
    private LocalDateTime renewsAt;
    private LocalDateTime canceledAt;
    private LocalDateTime updatedAt;

    protected Subscription() {
    }

    public Subscription(Builder builder) {
        this.subscriptionID = builder.subscriptionID;
        this.accountId = builder.accountId;
        this.accountType = builder.accountType;
        this.planKey = builder.planKey;
        this.paymentMethod = builder.paymentMethod;
        this.amountCents = builder.amountCents;
        this.currency = builder.currency;
        this.cardBrand = builder.cardBrand;
        this.cardLast4 = builder.cardLast4;
        this.paymentReference = builder.paymentReference;
        this.status = builder.status;
        this.createdAt = builder.createdAt;
        this.startsAt = builder.startsAt;
        this.renewsAt = builder.renewsAt;
        this.canceledAt = builder.canceledAt;
        this.updatedAt = builder.updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = SubscriptionStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getSubscriptionID() {
        return subscriptionID;
    }

    public String getAccountId() {
        return accountId;
    }

    public SubscriptionAccountType getAccountType() {
        return accountType;
    }

    public String getPlanKey() {
        return planKey;
    }

    public SubscriptionPaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public String getCurrency() {
        return currency;
    }

    public String getCardBrand() {
        return cardBrand;
    }

    public String getCardLast4() {
        return cardLast4;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getStartsAt() {
        return startsAt;
    }

    public LocalDateTime getRenewsAt() {
        return renewsAt;
    }

    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setSubscriptionID(String subscriptionID) {
        this.subscriptionID = subscriptionID;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public void setAccountType(SubscriptionAccountType accountType) {
        this.accountType = accountType;
    }

    public void setPlanKey(String planKey) {
        this.planKey = planKey;
    }

    public void setPaymentMethod(SubscriptionPaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setCardBrand(String cardBrand) {
        this.cardBrand = cardBrand;
    }

    public void setCardLast4(String cardLast4) {
        this.cardLast4 = cardLast4;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setStartsAt(LocalDateTime startsAt) {
        this.startsAt = startsAt;
    }

    public void setRenewsAt(LocalDateTime renewsAt) {
        this.renewsAt = renewsAt;
    }

    public void setCanceledAt(LocalDateTime canceledAt) {
        this.canceledAt = canceledAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Subscription that = (Subscription) o;
        return Objects.equals(subscriptionID, that.subscriptionID) &&
               Objects.equals(accountId, that.accountId) &&
               accountType == that.accountType &&
               status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(subscriptionID, accountId, accountType, status);
    }

    @Override
    public String toString() {
        return "Subscription{" +
                "subscriptionID='" + subscriptionID + '\'' +
                ", accountId='" + accountId + '\'' +
                ", accountType=" + accountType +
                ", planKey='" + planKey + '\'' +
                ", amountCents=" + amountCents +
                ", currency='" + currency + '\'' +
                ", status=" + status +
                ", renewsAt=" + renewsAt +
                '}';
    }

    public static class Builder {
        private String subscriptionID;
        private String accountId;
        private SubscriptionAccountType accountType;
        private String planKey;
        private SubscriptionPaymentMethod paymentMethod;
        private long amountCents;
        private String currency;
        private String cardBrand;
        private String cardLast4;
        private String paymentReference;
        private SubscriptionStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime startsAt;
        private LocalDateTime renewsAt;
        private LocalDateTime canceledAt;
        private LocalDateTime updatedAt;

        public Builder setSubscriptionID(String subscriptionID) {
            this.subscriptionID = subscriptionID;
            return this;
        }

        public Builder setAccountId(String accountId) {
            this.accountId = accountId;
            return this;
        }

        public Builder setAccountType(SubscriptionAccountType accountType) {
            this.accountType = accountType;
            return this;
        }

        public Builder setPlanKey(String planKey) {
            this.planKey = planKey;
            return this;
        }

        public Builder setPaymentMethod(SubscriptionPaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder setAmountCents(long amountCents) {
            this.amountCents = amountCents;
            return this;
        }

        public Builder setCurrency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder setCardBrand(String cardBrand) {
            this.cardBrand = cardBrand;
            return this;
        }

        public Builder setCardLast4(String cardLast4) {
            this.cardLast4 = cardLast4;
            return this;
        }

        public Builder setPaymentReference(String paymentReference) {
            this.paymentReference = paymentReference;
            return this;
        }

        public Builder setStatus(SubscriptionStatus status) {
            this.status = status;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setStartsAt(LocalDateTime startsAt) {
            this.startsAt = startsAt;
            return this;
        }

        public Builder setRenewsAt(LocalDateTime renewsAt) {
            this.renewsAt = renewsAt;
            return this;
        }

        public Builder setCanceledAt(LocalDateTime canceledAt) {
            this.canceledAt = canceledAt;
            return this;
        }

        public Builder setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder copy(Subscription subscription) {
            this.subscriptionID = subscription.subscriptionID;
            this.accountId = subscription.accountId;
            this.accountType = subscription.accountType;
            this.planKey = subscription.planKey;
            this.amountCents = subscription.amountCents;
            this.currency = subscription.currency;
            this.cardBrand = subscription.cardBrand;
            this.cardLast4 = subscription.cardLast4;
            this.paymentReference = subscription.paymentReference;
            this.status = subscription.status;
            this.createdAt = subscription.createdAt;
            this.startsAt = subscription.startsAt;
            this.renewsAt = subscription.renewsAt;
            this.canceledAt = subscription.canceledAt;
            this.updatedAt = subscription.updatedAt;
            return this;
        }

        public Subscription build() {
            return new Subscription(this);
        }
    }
}