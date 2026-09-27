package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

}
