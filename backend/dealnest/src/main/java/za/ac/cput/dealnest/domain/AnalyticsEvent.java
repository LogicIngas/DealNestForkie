package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String eventID;

    @Enumerated(EnumType.STRING)
    private AnalyticsEventType eventType;

    private String city;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    protected AnalyticsEvent() {
    }

    public AnalyticsEvent(Builder builder) {
        this.eventID = builder.eventID;
        this.eventType = builder.eventType;
        this.city = builder.city;
        this.createdAt = builder.createdAt;
        this.store = builder.store;
        this.promotion = builder.promotion;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public String getEventID() {
        return eventID;
    }

    public AnalyticsEventType getEventType() {
        return eventType;
    }

    public String getCity() {
        return city;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Store getStore() {
        return store;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public User getUser() {
        return user;
    }

    public void setEventID(String eventID) {
        this.eventID = eventID;
    }

    public void setEventType(AnalyticsEventType eventType) {
        this.eventType = eventType;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setStore(Store store) {
        this.store = store;
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
        AnalyticsEvent that = (AnalyticsEvent) o;
        return Objects.equals(eventID, that.eventID) &&
                eventType == that.eventType &&
                Objects.equals(user, that.user) &&
                Objects.equals(promotion, that.promotion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventID, eventType, user, promotion);
    }

    @Override
    public String toString() {
        return "AnalyticsEvent{" +
                "eventID='" + eventID + '\'' +
                ", eventType=" + eventType +
                ", city='" + city + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private String eventID;
        private AnalyticsEventType eventType;
        private String city;
        private LocalDateTime createdAt;
        private Store store;
        private Promotion promotion;
        private User user;

        public Builder setEventID(String eventID) {
            this.eventID = eventID;
            return this;
        }

        public Builder setEventType(AnalyticsEventType eventType) {
            this.eventType = eventType;
            return this;
        }

        public Builder setCity(String city) {
            this.city = city;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setStore(Store store) {
            this.store = store;
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

        public Builder copy(AnalyticsEvent event) {
            this.eventID = event.eventID;
            this.eventType = event.eventType;
            this.city = event.city;
            this.createdAt = event.createdAt;
            this.store = event.store;
            this.promotion = event.promotion;
            this.user = event.user;
            return this;
        }

        public AnalyticsEvent build() {
            return new AnalyticsEvent(this);
        }
    }
}