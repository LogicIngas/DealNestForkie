package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Promotion;
import java.util.List;

public interface IPromotionRepository extends JpaRepository<Promotion, String> {
    List<Promotion> findByStore_StoreId(String storeId);
    List<Promotion> findByIsActiveTrue();
}
