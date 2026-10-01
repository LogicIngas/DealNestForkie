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
        // The heart is a toggle, so /create is asked for on every "like" — including
        // repeats from a double tap, a retried request, or a client whose saved list was
        // read before another device added the same store. Inserting a second row for a
        // pair that already exists is what breaks un-liking: the delete removes the row
        // the caller is holding, the duplicate survives, and the heart stays filled. So
        // the create answers with the row that is already there instead of writing a
        // second one, which makes the endpoint idempotent.
        if (favoriteStore.getUser() != null && favoriteStore.getStore() != null) {
            List<FavoriteStore> existing = repository.findByUserAndStore(
                    favoriteStore.getUser().getUserID(), favoriteStore.getStore().getStoreId());
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }
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
