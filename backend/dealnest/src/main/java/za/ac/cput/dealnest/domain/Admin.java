package za.ac.cput.dealnest.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "admins", indexes = {
        @Index(name = "idx_admins_email", columnList = "email", unique = true)
})
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String adminID;

    @Column(unique = true)
    private String email;

    private String passwordHash;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    protected Admin() {
    }

    public Admin(Builder builder) {
        this.adminID = builder.adminID;
        this.email = builder.email;
        this.passwordHash = builder.passwordHash;
        this.isActive = builder.isActive;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
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

    public String getAdminID() {
        return adminID;
    }

    public String getEmail() {
        return email;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPasswordHash() {
        return passwordHash;
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

    public void setAdminID(String adminID) {
        this.adminID = adminID;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void approveStore(String storeId) {
        // Logic to approve a store
    }

    public void disableStore(String storeId) {
        // Logic to disable a store
    }

    public void removePromotion(String promotionId) {
        // Logic to remove a promotion
    }

    public void manageUsers(String userId) {
        // Logic to manage users
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Admin admin = (Admin) o;
        return Objects.equals(adminID, admin.adminID) &&
               Objects.equals(email, admin.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(adminID, email);
    }

    @Override
    public String toString() {
        return "Admin{" +
                "adminID='" + adminID + '\'' +
                ", email='" + email + '\'' +
                ", isActive=" + isActive +
                '}';
    }

    public static class Builder {
        private String adminID;
        private String email;
        private String passwordHash;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder setAdminID(String adminID) {
            this.adminID = adminID;
            return this;
        }

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder setPasswordHash(String passwordHash) {
            this.passwordHash = passwordHash;
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

        public Builder copy(Admin admin) {
            this.adminID = admin.adminID;
            this.email = admin.email;
            this.passwordHash = admin.passwordHash;
            this.isActive = admin.isActive;
            this.createdAt = admin.createdAt;
            this.updatedAt = admin.updatedAt;
            return this;
        }

        public Admin build() {
            return new Admin(this);
        }
    }
}
