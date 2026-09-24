package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Local mirror of a PayFast recurring-billing subscription. The plan tier still
 * lives on the User/Store rows (that's what the plus/pro feature gates read),
 * while this record keeps the PayFast token + last payment id, the agreed
 * amount, and the subscription lifecycle so the scheduler can downgrade the
 * plan when a subscription lapses or is cancelled.
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

    /** Agreed monthly amount in ZAR cents (4900 = R49.00, 19900 = R199.00). */
    private long amountCents;

    private String currency;

    /** PayFast recurring-billing token (captured from the ITN; sandbox doesn't show it). */
    private String payfastToken;

    /** Last pf_payment_id received from PayFast. */
    private String payfastPaymentId;

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
        this.amountCents = builder.amountCents;
        this.currency = builder.currency;
        this.payfastToken = builder.payfastToken;
        this.payfastPaymentId = builder.payfastPaymentId;
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

    public long getAmountCents() {
        return amountCents;
    }

    public String getCurrency() {
        return currency;
    }

    public String getPayfastToken() {
        return payfastToken;
    }

    public String getPayfastPaymentId() {
        return payfastPaymentId;
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

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setPayfastToken(String payfastToken) {
        this.payfastToken = payfastToken;
    }

    public void setPayfastPaymentId(String payfastPaymentId) {
        this.payfastPaymentId = payfastPaymentId;
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
        private long amountCents;
        private String currency;
        private String payfastToken;
        private String payfastPaymentId;
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

        public Builder setAmountCents(long amountCents) {
            this.amountCents = amountCents;
            return this;
        }

        public Builder setCurrency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder setPayfastToken(String payfastToken) {
            this.payfastToken = payfastToken;
            return this;
        }

        public Builder setPayfastPaymentId(String payfastPaymentId) {
            this.payfastPaymentId = payfastPaymentId;
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
            this.payfastToken = subscription.payfastToken;
            this.payfastPaymentId = subscription.payfastPaymentId;
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