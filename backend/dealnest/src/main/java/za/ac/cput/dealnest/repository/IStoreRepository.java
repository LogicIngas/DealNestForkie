package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;

import java.util.List;
import java.util.Optional;

public interface IStoreRepository extends JpaRepository<Store,String> {
    Optional<Store> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Store> findByCategory(StoreCategory category);

    List<Store> findByCity(String city);

    /**
     * Store lists are serialised to JSON with the owner attached, and the owner is a
     * lazy to-one, so leaving it unfetched costs one extra query per store. It is
     * fetched here instead. To-one, so the join cannot duplicate rows.
     */
    @Query("select s from Store s join fetch s.user where s.isActive = true")
    List<Store> findByIsActiveTrue();

    List<Store> findByStoreNameContainingIgnoreCase(String storeName);

    Optional<Store> findByUser_UserID(String userID);

    /** Owner pre-fetched, for the list endpoints that return every store. */
    @Query("select s from Store s join fetch s.user")
    List<Store> findAllWithOwner();

    /**
     * A single store with its owner attached.
     *
     * <p>{@code findById} cannot serve the read endpoints: a Store is serialised with
     * its {@code user} field, and that is a lazy to-one. With open-in-view off there is
     * no session left when Jackson reaches it, so the owner has to come back with the
     * store. It is also the ownership check on most write paths, which is the same
     * association.
     */
    @Query("select s from Store s join fetch s.user where s.storeId = :storeId")
    Optional<Store> findDetailedById(@Param("storeId") String storeId);

    /** The store a user owns, owner attached, for the "my store" endpoints. */
    @Query("select s from Store s join fetch s.user where s.user.userID = :userID")
    Optional<Store> findDetailedByUserId(@Param("userID") String userID);
}
