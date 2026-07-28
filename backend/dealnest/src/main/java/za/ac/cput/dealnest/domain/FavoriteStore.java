package za.ac.cput.dealnest.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "favorite_stores")
public class FavoriteStore {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String favoriteStoreID;

    private LocalDateTime addedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    protected FavoriteStore() {
    }

    public FavoriteStore(Builder builder) {
        this.favoriteStoreID = builder.favoriteStoreID;
        this.addedDate = builder.addedDate;
        this.user = builder.user;
        this.store = builder.store;
    }

    @PrePersist
    protected void onCreate() {
        if (addedDate == null) {
            addedDate = LocalDateTime.now();
        }
    }

    public String getFavoriteStoreID() {
        return favoriteStoreID;
    }

    public LocalDateTime getAddedDate() {
        return addedDate;
    }

    public User getUser() {
        return user;
    }

    public Store getStore() {
        return store;
    }

    public void favorited() {
        this.addedDate = LocalDateTime.now();
    }

    public void removeFavorite() {
        // Logic to remove favorite
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        FavoriteStore that = (FavoriteStore) o;
        return Objects.equals(favoriteStoreID, that.favoriteStoreID) &&
               Objects.equals(user, that.user) &&
               Objects.equals(store, that.store);
    }

    @Override
    public int hashCode() {
        return Objects.hash(favoriteStoreID, user, store);
    }

    @Override
    public String toString() {
        return "FavoriteStore{" +
                "favoriteStoreID='" + favoriteStoreID + '\'' +
                ", addedDate=" + addedDate +
                '}';
    }

    public static class Builder {
        private String favoriteStoreID;
        private LocalDateTime addedDate;
        private User user;
        private Store store;

        public Builder setFavoriteStoreID(String favoriteStoreID) {
            this.favoriteStoreID = favoriteStoreID;
            return this;
        }

        public Builder setAddedDate(LocalDateTime addedDate) {
            this.addedDate = addedDate;
            return this;
        }

        public Builder setUser(User user) {
            this.user = user;
            return this;
        }

        public Builder setStore(Store store) {
            this.store = store;
            return this;
        }

        public Builder copy(FavoriteStore favoriteStore) {
            this.favoriteStoreID = favoriteStore.favoriteStoreID;
            this.addedDate = favoriteStore.addedDate;
            this.user = favoriteStore.user;
            this.store = favoriteStore.store;
            return this;
        }

        public FavoriteStore build() {
            return new FavoriteStore(this);
        }
    }
}
