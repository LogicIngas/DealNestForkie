package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.factory.NotificationFactory;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.service.IFavoriteStoreService;
import za.ac.cput.dealnest.service.INotificationService;
import za.ac.cput.dealnest.service.IPriceTrackingService;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.List;

@Service
public class PromotionServiceImpl implements IPromotionService {

    private final IPromotionRepository repository;
    private final IFavoriteStoreService favoriteStoreService;
    private final INotificationService notificationService;
    private final IStoreService storeService;
    private final IPriceTrackingService priceTrackingService;

    public PromotionServiceImpl(IPromotionRepository repository, IFavoriteStoreService favoriteStoreService, INotificationService notificationService, IStoreService storeService, IPriceTrackingService priceTrackingService) {
        this.repository = repository;
        this.favoriteStoreService = favoriteStoreService;
        this.notificationService = notificationService;
        this.storeService = storeService;
        this.priceTrackingService = priceTrackingService;
    }

    @Override
    public Promotion create(Promotion promotion) {
        enforceFeaturedRules(promotion);
        Promotion saved = repository.save(promotion);
        priceTrackingService.recordIfChanged(null, saved);
        notifyFollowers(saved);
        return saved;
    }

    // Featuring a deal is a Pro-store perk: a non-Pro store's featured flag is
    // silently dropped (never trusted from the client), and a store may only
    // have one featured deal at a time, so setting a new one clears the old.
    private void enforceFeaturedRules(Promotion promotion) {
        if (!Boolean.TRUE.equals(promotion.getFeatured()) || promotion.getStore() == null) return;

        Store store = storeService.read(promotion.getStore().getStoreId());
        if (store == null || store.getPlanTier() != StorePlanTier.PRO) {
            promotion.setFeatured(false);
            return;
        }

        repository.findByStore_StoreId(store.getStoreId()).stream()
                .filter(p -> !p.getPromotionID().equals(promotion.getPromotionID()) && Boolean.TRUE.equals(p.getFeatured()))
                .forEach(p -> {
                    p.setFeatured(false);
                    repository.save(p);
                });
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
        enforceFeaturedRules(promotion);
        Promotion previous = repository.findById(promotion.getPromotionID()).orElse(null);
        Promotion saved = repository.save(promotion);
        priceTrackingService.recordIfChanged(previous, saved);
        return saved;
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
