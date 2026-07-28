package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.FavoriteStore;
import java.util.List;

public interface IFavoriteStoreService extends IService<FavoriteStore, String> {
    List<FavoriteStore> findByUserId(String userId);
    List<FavoriteStore> findByStoreId(String storeId);
    List<FavoriteStore> getAll();
}
