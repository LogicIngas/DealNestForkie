package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.DealAlert;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StorePlanTier;
import za.ac.cput.dealnest.factory.NotificationFactory;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.service.IDealAlertService;
import za.ac.cput.dealnest.service.IFavoriteStoreService;
import za.ac.cput.dealnest.service.INotificationService;
import za.ac.cput.dealnest.service.IPriceTrackingService;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.Comparator;
import java.util.List;

@Service
public class PromotionServiceImpl implements IPromotionService {

    private final IPromotionRepository repository;
    private final IFavoriteStoreService favoriteStoreService;
    private final INotificationService notificationService;
    private final IStoreService storeService;
    private final IPriceTrackingService priceTrackingService;
    private final IDealAlertService dealAlertService;

    public PromotionServiceImpl(IPromotionRepository repository, IFavoriteStoreService favoriteStoreService, INotificationService notificationService, IStoreService storeService, IPriceTrackingService priceTrackingService, IDealAlertService dealAlertService) {
        this.repository = repository;
        this.favoriteStoreService = favoriteStoreService;
        this.notificationService = notificationService;
        this.storeService = storeService;
        this.priceTrackingService = priceTrackingService;
        this.dealAlertService = dealAlertService;
    }

    @Override
    public Promotion create(Promotion promotion) {
        enforcePremiumRules(promotion);
        Promotion saved = repository.save(promotion);
        priceTrackingService.recordIfChanged(null, saved);
        notifyFollowers(saved);
        notifyDealAlerts(saved);
        return saved;
    }

    // Featuring a deal is a Pro-store perk: a non-Pro store's featured flag is
    // silently dropped (never trusted from the client), and a store may only
    // have one featured deal at a time, so setting a new one clears the old.
    // The same gating applies to promoted listings.
    private void enforcePremiumRules(Promotion promotion) {
        if (promotion.getStore() == null) return;

        Store store = storeService.read(promotion.getStore().getStoreId());
        if (store == null || store.getPlanTier() != StorePlanTier.PRO) {
            promotion.setFeatured(false);
            promotion.setPromoted(false);
            return;
        }

        if (Boolean.TRUE.equals(promotion.getFeatured())) {
            repository.findByStore_StoreId(store.getStoreId()).stream()
                    .filter(p -> !p.getPromotionID().equals(promotion.getPromotionID()) && Boolean.TRUE.equals(p.getFeatured()))
                    .forEach(p -> {
                        p.setFeatured(false);
                        repository.save(p);
                    });
        }

        if (Boolean.TRUE.equals(promotion.getPromoted())) {
            repository.findByStore_StoreId(store.getStoreId()).stream()
                    .filter(p -> !p.getPromotionID().equals(promotion.getPromotionID()) && Boolean.TRUE.equals(p.getPromoted()))
                    .forEach(p -> {
                        p.setPromoted(false);
                        repository.save(p);
                    });
        }
    }

    // Notifies DealNest Plus subscribers whose deal alerts match this promotion.
    // Every matching alert produces a priority notification (gold in the bell).
    private void notifyDealAlerts(Promotion promotion) {
        if (promotion.getStore() == null) return;
        Store store = storeService.read(promotion.getStore().getStoreId());
        if (store == null) return;

        List<DealAlert> alerts = dealAlertService.findActive();
        for (DealAlert alert : alerts) {
            if (!alert.matches(promotion)) continue;
            Notification notification = NotificationFactory.createPriorityNotification(
                    "Deal alert match",
                    alert.getCategory() != null ? alert.getCategory().name() : store.getStoreName()
                            + " deal matches your alert: " + promotion.getTitle() + ".",
                    alert.getUser()
            );
            if (notification != null) {
                notificationService.create(notification);
            }
        }
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
        enforcePremiumRules(promotion);
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
        // Promoted and featured deals surface first, then everything else.
        return repository.findByIsActiveTrue().stream()
                .sorted(Comparator
                        .comparing((Promotion p) -> !Boolean.TRUE.equals(p.getPromoted()))
                        .thenComparing(p -> !Boolean.TRUE.equals(p.getFeatured()))
                        .thenComparing(p -> p.getCreatedAt() == null ? java.time.LocalDateTime.MIN : p.getCreatedAt(), Comparator.reverseOrder()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<Promotion> getAll() {
        return repository.findAll();
    }
}
