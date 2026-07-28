package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "search_history")
public class SearchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String searchID;

    private String searchQuery;
    private LocalDateTime searchDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    protected SearchHistory() {
    }

    public SearchHistory(Builder builder) {
        this.searchID = builder.searchID;
        this.searchQuery = builder.searchQuery;
        this.searchDate = builder.searchDate;
        this.user = builder.user;
    }

    @PrePersist
    protected void onCreate() {
        if (searchDate == null) {
            searchDate = LocalDateTime.now();
        }
    }

    public String getSearchID() {
        return searchID;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public LocalDateTime getSearchDate() {
        return searchDate;
    }

    public User getUser() {
        return user;
    }

    public void clearHistory() {
        // Logic to clear history
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        SearchHistory that = (SearchHistory) o;
        return Objects.equals(searchID, that.searchID) &&
               Objects.equals(searchQuery, that.searchQuery) &&
               Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(searchID, searchQuery, user);
    }

    @Override
    public String toString() {
        return "SearchHistory{" +
                "searchID='" + searchID + '\'' +
                ", searchQuery='" + searchQuery + '\'' +
                ", searchDate=" + searchDate +
                '}';
    }

    public static class Builder {
        private String searchID;
        private String searchQuery;
        private LocalDateTime searchDate;
        private User user;

        public Builder setSearchID(String searchID) {
            this.searchID = searchID;
            return this;
        }

        public Builder setSearchQuery(String searchQuery) {
            this.searchQuery = searchQuery;
            return this;
        }

        public Builder setSearchDate(LocalDateTime searchDate) {
            this.searchDate = searchDate;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder copy(SearchHistory searchHistory) {
            this.searchID = searchHistory.searchID;
            this.searchQuery = searchHistory.searchQuery;
            this.searchDate = searchHistory.searchDate;
            this.user = searchHistory.user;
            return this;
        }

        public SearchHistory build() {
            return new SearchHistory(this);
        }
    }
}
