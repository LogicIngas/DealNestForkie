package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;

import java.util.List;
import java.util.Optional;

public interface IStoreService extends IService<Store, String>{
    Optional<Store> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Store> findByCategory(StoreCategory category);

    List<Store> findByCity(String city);

    List<Store> findByIsActiveTrue();

    /**
     * The top {@code limit} active stores by rating, owner attached.
     *
     * <p>For callers drawing a fixed number of cards. See
     * {@link IStoreRepository#findActive(org.springframework.data.domain.Pageable)} for
     * why the walk stops instead of returning the whole table.
     */
    List<Store> findActive(int limit);

    List<Store> findByStoreNameContainingIgnoreCase(String storeName);

    Optional<Store> findByUserId(String userId);

    List<Store> getAll();

    boolean delete(String id);
}
