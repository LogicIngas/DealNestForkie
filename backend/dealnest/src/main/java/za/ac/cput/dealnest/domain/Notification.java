package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String notificationID;

    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected Notification() {
    }

    public Notification(Builder builder) {
        this.notificationID = builder.notificationID;
        this.title = builder.title;
        this.message = builder.message;
        this.isRead = builder.isRead;
        this.createdAt = builder.createdAt;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }

    public String getNotificationID() {
        return notificationID;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public Boolean getRead() {
        return isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setNotificationID(String notificationID) {
        this.notificationID = notificationID;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setRead(Boolean read) {
        isRead = read;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void send() {
        // Logic to send notification
    }

    public void markRead() {
        this.isRead = true;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Notification that = (Notification) o;
        return Objects.equals(notificationID, that.notificationID) &&
               Objects.equals(title, that.title) &&
               Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(notificationID, title, user);
    }

    @Override
    public String toString() {
        return "Notification{" +
                "notificationID='" + notificationID + '\'' +
                ", title='" + title + '\'' +
                ", isRead=" + isRead +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private String notificationID;
        private String title;
        private String message;
        private Boolean isRead;
        private LocalDateTime createdAt;
        private User user;

        public Builder setNotificationID(String notificationID) {
            this.notificationID = notificationID;
            return this;
        }

        public Builder setTitle(String title) {
            this.title = title;
            return this;
        }

        public Builder setMessage(String message) {
            this.message = message;
            return this;
        }

        public Builder setRead(Boolean read) {
            isRead = read;
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

        public Builder copy(Notification notification) {
            this.notificationID = notification.notificationID;
            this.title = notification.title;
            this.message = notification.message;
            this.isRead = notification.isRead;
            this.createdAt = notification.createdAt;
            this.user = notification.user;
            return this;
        }

        public Notification build() {
            return new Notification(this);
        }
    }
}
