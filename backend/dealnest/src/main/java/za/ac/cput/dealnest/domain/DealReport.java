package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "deal_reports")
public class DealReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String reportID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealReportReason reason;

    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealReportStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected DealReport() {
    }

    public DealReport(Builder builder) {
        this.reportID = builder.reportID;
        this.reason = builder.reason;
        this.details = builder.details;
        this.status = builder.status;
        this.createdAt = builder.createdAt;
        this.resolvedAt = builder.resolvedAt;
        this.promotion = builder.promotion;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = DealReportStatus.PENDING;
        }
    }

    public String getReportID() {
        return reportID;
    }

    public DealReportReason getReason() {
        return reason;
    }

    public String getDetails() {
        return details;
    }

    public DealReportStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public User getUser() {
        return user;
    }

    public void setReportID(String reportID) {
        this.reportID = reportID;
    }

    public void setReason(DealReportReason reason) {
        this.reason = reason;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public void setStatus(DealReportStatus status) {
        this.status = status;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public void setPromotion(Promotion promotion) {
        this.promotion = promotion;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void resolve(DealReportStatus resolution) {
        this.status = resolution;
        this.resolvedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        DealReport that = (DealReport) o;
        return Objects.equals(reportID, that.reportID) &&
               Objects.equals(promotion, that.promotion) &&
               Objects.equals(user, that.user) &&
               reason == that.reason;
    }

    @Override
    public int hashCode() {
        return Objects.hash(reportID, promotion, user, reason);
    }

    @Override
    public String toString() {
        return "DealReport{" +
                "reportID='" + reportID + '\'' +
                ", reason=" + reason +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }

    public static class Builder {
        private String reportID;
        private DealReportReason reason;
        private String details;
        private DealReportStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
        private Promotion promotion;
        private User user;

        public Builder setReportID(String reportID) {
            this.reportID = reportID;
            return this;
        }

        public Builder setReason(DealReportReason reason) {
            this.reason = reason;
            return this;
        }

        public Builder setDetails(String details) {
            this.details = details;
            return this;
        }

        public Builder setStatus(DealReportStatus status) {
            this.status = status;
            return this;
        }

        public Builder setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder setResolvedAt(LocalDateTime resolvedAt) {
            this.resolvedAt = resolvedAt;
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

        public Builder copy(DealReport report) {
            this.reportID = report.reportID;
            this.reason = report.reason;
            this.details = report.details;
            this.status = report.status;
            this.createdAt = report.createdAt;
            this.resolvedAt = report.resolvedAt;
            this.promotion = report.promotion;
            this.user = report.user;
            return this;
        }

        public DealReport build() {
            return new DealReport(this);
        }
    }
}
