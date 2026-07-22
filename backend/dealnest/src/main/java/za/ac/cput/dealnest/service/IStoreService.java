package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Store;

import java.util.List;
import java.util.Optional;

public interface IStoreService extends IService<Store, String>{
    Optional<Store> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Store> findByCategory(StoreCategory category);

    List<Store> findByCity(String city);

    List<Store> findByIsActiveTrue();

    List<Store> findByStoreNameContainingIgnoreCase(String storeName);

    List<Store> getAll();

    boolean delete(String id);
}
