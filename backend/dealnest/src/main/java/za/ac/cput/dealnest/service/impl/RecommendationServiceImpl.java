package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IFavoriteStoreRepository;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.repository.ISavedPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IRecommendationService;
import za.ac.cput.dealnest.util.GeoUtils;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecommendationServiceImpl implements IRecommendationService {

    // Weighted sum of three signals; a user with no favorites and no location
    // simply gets rating-only ranking, which is the same behavior the app
    // already had before recommendations existed.
    private static final double RATING_WEIGHT = 0.4;
    private static final double CATEGORY_WEIGHT = 0.4;
    private static final double PROXIMITY_WEIGHT = 0.2;

    private final IStoreRepository storeRepository;
    private final IFavoriteStoreRepository favoriteStoreRepository;
    private final IUserRepository userRepository;
    private final ISavedPromotionRepository savedPromotionRepository;
    private final IRedemptionRepository redemptionRepository;

    public RecommendationServiceImpl(IStoreRepository storeRepository,
                                      IFavoriteStoreRepository favoriteStoreRepository,
                                      IUserRepository userRepository,
                                      ISavedPromotionRepository savedPromotionRepository,
                                      IRedemptionRepository redemptionRepository) {
        this.storeRepository = storeRepository;
        this.favoriteStoreRepository = favoriteStoreRepository;
        this.userRepository = userRepository;
        this.savedPromotionRepository = savedPromotionRepository;
        this.redemptionRepository = redemptionRepository;
    }

    @Override
    public List<Store> getRecommendedForUser(String userId) {
        Set<StoreCategory> favoritedCategories = categoriesFavoritedVia(userId);
        return rank(userId, favoritedCategories);
    }

    @Override
    public List<Store> getPersonalizedForUser(String userId) {
        // DealNest Plus personalized ranking: category preferences are drawn
        // from everything the user has engaged with (saved, claimed, redeemed,
        // favorited) instead of just saved stores.
        Set<StoreCategory> engagedCategories = categoriesFavoritedVia(userId);
        engagedCategories.addAll(savedPromotionRepository.findByUser_UserID(userId).stream()
                .map(SavedPromotion::getPromotion)
                .filter(Objects::nonNull)
                .map(p -> p.getStore())
                .filter(Objects::nonNull)
                .map(Store::getCategory)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
        engagedCategories.addAll(redemptionRepository.findByUser_UserID(userId).stream()
                .map(Redemption::getPromotion)
                .filter(Objects::nonNull)
                .map(p -> p.getStore())
                .filter(Objects::nonNull)
                .map(Store::getCategory)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
        return rank(userId, engagedCategories);
    }

    private Set<StoreCategory> categoriesFavoritedVia(String userId) {
        return favoriteStoreRepository.findByUser_UserID(userId).stream()
                .map(FavoriteStore::getStore)
                .filter(Objects::nonNull)
                .map(Store::getCategory)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private List<Store> rank(String userId, Set<StoreCategory> engagedCategories) {
        User user = userRepository.findById(userId).orElse(null);
        boolean hasLocation = user != null && (user.getLatitude() != 0 || user.getLongitude() != 0);
        User locatedUser = hasLocation ? user : null;

        return storeRepository.findByIsActiveTrue().stream()
                .sorted((a, b) -> Double.compare(
                        score(b, engagedCategories, locatedUser),
                        score(a, engagedCategories, locatedUser)))
                .collect(Collectors.toList());
    }

    private double score(Store store, Set<StoreCategory> engagedCategories, User user) {
        double ratingScore = store.getAverageRating() != null ? store.getAverageRating() / 5.0 : 0.0;
        double categoryScore = engagedCategories.contains(store.getCategory()) ? 1.0 : 0.0;
        double proximityScore = 0.0;
        if (user != null && (store.getLatitude() != 0 || store.getLongitude() != 0)) {
            double distanceKm = GeoUtils.haversineKm(user.getLatitude(), user.getLongitude(), store.getLatitude(), store.getLongitude());
            proximityScore = 1 / (1 + distanceKm);
        }
        return RATING_WEIGHT * ratingScore + CATEGORY_WEIGHT * categoryScore + PROXIMITY_WEIGHT * proximityScore;
    }
}
