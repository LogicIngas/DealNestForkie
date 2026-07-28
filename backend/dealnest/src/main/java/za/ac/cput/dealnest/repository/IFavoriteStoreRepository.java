package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.FavoriteStore;
import java.util.List;

public interface IFavoriteStoreRepository extends JpaRepository<FavoriteStore, String> {
    List<FavoriteStore> findByUser_UserID(String userID);
    List<FavoriteStore> findByStore_StoreId(String storeId);
}
