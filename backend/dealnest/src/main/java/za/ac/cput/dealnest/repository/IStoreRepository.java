package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Store;

import java.util.List;
import java.util.Optional;

public interface IStoreRepository extends JpaRepository<Store,String> {
    Optional<Store> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Store> findByCategory(StoreCategory category);

    List<Store> findByCity(String city);

    List<Store> findByIsActiveTrue();

    List<Store> findByStoreNameContainingIgnoreCase(String storeName);

}
