package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.FavoriteStore;
import java.util.List;
import java.util.Optional;

public interface IFavoriteStoreRepository extends JpaRepository<FavoriteStore, String> {

    /**
     * The favouriting user and the favourited store's owner come back attached.
     *
     * <p>A FavoriteStore is serialised with both {@code user} and {@code store}, and a
     * Store is serialised with its owner, so an unfetched result cost up to three
     * queries per row. To-one joins throughout, so no rows are duplicated. Served by
     * idx_favorite_stores_user / _store.
     */
    @Query("select f from FavoriteStore f join fetch f.user join fetch f.store s join fetch s.user "
            + "where f.user.userID = :userID")
    List<FavoriteStore> findByUser_UserID(String userID);

    @Query("select f from FavoriteStore f join fetch f.user join fetch f.store s join fetch s.user "
            + "where s.storeId = :storeId")
    List<FavoriteStore> findByStore_StoreId(String storeId);

    @Query("select f from FavoriteStore f join fetch f.user join fetch f.store s join fetch s.user "
            + "where f.favoriteStoreID = :favoriteStoreID")
    Optional<FavoriteStore> findDetailedById(@Param("favoriteStoreID") String favoriteStoreID);

    /**
     * Every row this user has saved for one store.
     *
     * <p>{@code favorite_stores} has no uniqueness constraint on (user, store) — schema.sql
     * only indexes the two columns — so a second save of the same pair would insert a
     * duplicate row. The heart then reads as filled after one un-heart, because deleting
     * the row the client was holding leaves the other one behind.
     *
     * <p>A List rather than a single result on purpose: if duplicates are already in the
     * table, a scalar finder throws instead of letting the caller de-duplicate.
     * Served by idx_favorite_stores_user.
     */
    @Query("select f from FavoriteStore f join fetch f.user join fetch f.store s join fetch s.user "
            + "where f.user.userID = :userID and s.storeId = :storeId")
    List<FavoriteStore> findByUserAndStore(@Param("userID") String userID, @Param("storeId") String storeId);
}
