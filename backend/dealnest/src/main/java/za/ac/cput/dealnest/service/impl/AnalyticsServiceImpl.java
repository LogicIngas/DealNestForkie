package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.AnalyticsEvent;
import za.ac.cput.dealnest.domain.AnalyticsEventType;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IAnalyticsEventRepository;
import za.ac.cput.dealnest.repository.IFavoriteStoreRepository;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IAnalyticsService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements IAnalyticsService {

    private final IAnalyticsEventRepository repository;
    private final IPromotionRepository promotionRepository;
    private final IStoreRepository storeRepository;
    private final IUserRepository userRepository;
    private final IFavoriteStoreRepository favoriteStoreRepository;

    public AnalyticsServiceImpl(IAnalyticsEventRepository repository,
                                 IPromotionRepository promotionRepository,
                                 IStoreRepository storeRepository,
                                 IUserRepository userRepository,
                                 IFavoriteStoreRepository favoriteStoreRepository) {
        this.repository = repository;
        this.promotionRepository = promotionRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.favoriteStoreRepository = favoriteStoreRepository;
    }

    @Override
    public void recordEvent(AnalyticsEventType type, String userId, String storeId, String promotionId) {
        if (type == null) return;

        Store store = null;
        Promotion promotion = null;
        User user = null;

        if (promotionId != null) {
            promotion = promotionRepository.findById(promotionId).orElse(null);
            if (promotion != null && promotion.getStore() != null) {
                store = storeRepository.findById(promotion.getStore().getStoreId()).orElse(null);
            }
        }
        if (store == null && storeId != null) {
            store = storeRepository.findById(storeId).orElse(null);
        }
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        AnalyticsEvent event = new AnalyticsEvent.Builder()
                .setEventType(type)
                .setStore(store)
                .setPromotion(promotion)
                .setUser(user)
                .setCity(user != null && store != null ? store.getCity() : null)
                .build();

        repository.save(event);
    }

    @Override
    public Map<String, Object> getStoreAnalytics(String storeId) {
        Store store = storeRepository.findById(storeId).orElse(null);
        if (store == null) return new HashMap<>();

        long views = repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.STORE_VIEW)
                + repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.PROMOTION_VIEW);
        long saves = repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_SAVED);
        long claims = repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_CLAIMED);
        long redeems = repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_REDEEMED);
        long shares = repository.countByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_SHARED);

        List<Promotion> promotions = promotionRepository.findByStore_StoreId(storeId);
        List<Map<String, Object>> promotionStats = new ArrayList<>();
        for (Promotion p : promotions) {
            long pSaves = repository.countByPromotion_PromotionIDAndEventType(p.getPromotionID(), AnalyticsEventType.DEAL_SAVED);
            long pClaims = repository.countByPromotion_PromotionIDAndEventType(p.getPromotionID(), AnalyticsEventType.DEAL_CLAIMED);
            long pRedeems = repository.countByPromotion_PromotionIDAndEventType(p.getPromotionID(), AnalyticsEventType.DEAL_REDEEMED);
            long pViews = repository.countByPromotion_PromotionIDAndEventType(p.getPromotionID(), AnalyticsEventType.PROMOTION_VIEW);
            double conversion = pSaves > 0 ? Math.round((pRedeems * 100.0 / pSaves) * 10.0) / 10.0 : 0.0;
            Map<String, Object> row = new HashMap<>();
            row.put("promotionID", p.getPromotionID());
            row.put("title", p.getTitle());
            row.put("active", p.getActive());
            row.put("views", pViews);
            row.put("saves", pSaves);
            row.put("claims", pClaims);
            row.put("redeems", pRedeems);
            row.put("conversionRate", conversion);
            promotionStats.add(row);
        }
        promotionStats.sort((a, b) -> Long.compare((Long) b.get("redeems"), (Long) a.get("redeems")));

        Map<String, Object> result = new HashMap<>();
        result.put("storeName", store.getStoreName());
        result.put("views", views);
        result.put("saves", saves);
        result.put("claims", claims);
        result.put("redeems", redeems);
        result.put("shares", shares);
        result.put("followers", favoriteStoreRepository.findByStore_StoreId(storeId).size());
        result.put("promotionStats", promotionStats);
        return result;
    }

    @Override
    public Map<String, Object> getCustomerInsights(String storeId) {
        Store store = storeRepository.findById(storeId).orElse(null);
        if (store == null) return new HashMap<>();

        List<AnalyticsEvent> engagement = repository.findByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_SAVED);

        engagement.addAll(repository.findByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_CLAIMED));
        engagement.addAll(repository.findByStore_StoreIdAndEventType(storeId, AnalyticsEventType.DEAL_REDEEMED));

        Map<String, Long> byCity = engagement.stream()
                .filter(e -> e.getCity() != null && !e.getCity().isBlank())
                .collect(Collectors.groupingBy(AnalyticsEvent::getCity, Collectors.counting()));

        Map<String, Object> result = new HashMap<>();
        result.put("topCities", byCity.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> Math.toIntExact(e.getValue()),
                        (a, b) -> a,
                        java.util.LinkedHashMap::new
                )));
        result.put("totalEngagements", engagement.size());
        return result;
    }
}