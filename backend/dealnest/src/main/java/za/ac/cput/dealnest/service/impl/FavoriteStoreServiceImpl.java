package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.repository.IFavoriteStoreRepository;
import za.ac.cput.dealnest.service.IFavoriteStoreService;

import java.util.List;

@Service
public class FavoriteStoreServiceImpl implements IFavoriteStoreService {

    private final IFavoriteStoreRepository repository;

    public FavoriteStoreServiceImpl(IFavoriteStoreRepository repository) {
        this.repository = repository;
    }

    @Override
    public FavoriteStore create(FavoriteStore favoriteStore) {
        return repository.save(favoriteStore);
    }

    @Override
    public FavoriteStore read(String favoriteStoreId) {
        return repository.findDetailedById(favoriteStoreId).orElse(null);
    }

    @Override
    public FavoriteStore update(FavoriteStore favoriteStore) {
        return repository.save(favoriteStore);
    }

    @Override
    public boolean delete(String favoriteStoreId) {
        repository.deleteById(favoriteStoreId);
        return true;
    }

    @Override
    public List<FavoriteStore> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<FavoriteStore> findByStoreId(String storeId) {
        return repository.findByStore_StoreId(storeId);
    }

    @Override
    public List<FavoriteStore> getAll() {
        return repository.findAll();
    }
}
