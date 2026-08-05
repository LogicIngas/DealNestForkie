package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.factory.NotificationFactory;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.service.IFavoriteStoreService;
import za.ac.cput.dealnest.service.INotificationService;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.List;

@Service
public class PromotionServiceImpl implements IPromotionService {

    private final IPromotionRepository repository;
    private final IFavoriteStoreService favoriteStoreService;
    private final INotificationService notificationService;
    private final IStoreService storeService;

    public PromotionServiceImpl(IPromotionRepository repository, IFavoriteStoreService favoriteStoreService, INotificationService notificationService, IStoreService storeService) {
        this.repository = repository;
        this.favoriteStoreService = favoriteStoreService;
        this.notificationService = notificationService;
        this.storeService = storeService;
    }

    @Override
    public Promotion create(Promotion promotion) {
        Promotion saved = repository.save(promotion);
        notifyFollowers(saved);
        return saved;
    }

    private void notifyFollowers(Promotion promotion) {
        if (promotion.getStore() == null) return;
        // The incoming promotion only carries a partial Store reference (just the id),
        // so re-read the full store to get its name for the notification text.
        Store store = storeService.read(promotion.getStore().getStoreId());
        if (store == null) return;
        List<FavoriteStore> followers = favoriteStoreService.findByStoreId(store.getStoreId());
        String storeName = store.getStoreName();
        for (FavoriteStore follower : followers) {
            Notification notification = NotificationFactory.createNotification(
                    "New deal near you",
                    storeName + " just posted " + promotion.getTitle() + ".",
                    follower.getUser()
            );
            if (notification != null) {
                notificationService.create(notification);
            }
        }
    }

    @Override
    public Promotion read(String promotionId) {
        return repository.findById(promotionId).orElse(null);
    }

    @Override
    public Promotion update(Promotion promotion) {
        return repository.save(promotion);
    }

    @Override
    public boolean delete(String promotionId) {
        repository.deleteById(promotionId);
        return true;
    }

    @Override
    public List<Promotion> findByStoreId(String storeId) {
        return repository.findByStore_StoreId(storeId);
    }

    @Override
    public List<Promotion> findByIsActiveTrue() {
        return repository.findByIsActiveTrue();
    }

    @Override
    public List<Promotion> getAll() {
        return repository.findAll();
    }
}
