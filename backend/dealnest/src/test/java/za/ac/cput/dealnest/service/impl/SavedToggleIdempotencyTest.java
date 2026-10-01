package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IFavoriteStoreRepository;
import za.ac.cput.dealnest.repository.ISavedPromotionRepository;
import za.ac.cput.dealnest.service.IAnalyticsService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * A heart and a bookmark are toggles, so their create endpoints are asked for again on
 * every "like": a double tap, a retried request, or a second device whose saved list was
 * read before the first one saved.
 *
 * <p>Neither table has a uniqueness constraint on (user, item), so an unguarded insert
 * silently writes a second row for a pair that is already there. The damage shows up on
 * the way back out rather than on the way in: the delete removes the row the client was
 * holding, the duplicate survives, and the control still reads as filled after a reload.
 * So the create has to answer with the row that already exists instead of writing another.
 *
 * <p>The saved-deal case has a second reason to check first. Re-saving a deal the user
 * already has is not a new save, so answering 402 for it would refuse a no-op and blame
 * the free-plan cap for a bookmark that was never at risk.
 */
class SavedToggleIdempotencyTest {

    private IFavoriteStoreRepository favoriteRepository;
    private ISavedPromotionRepository savedRepository;
    private IUserService userService;
    private IAnalyticsService analyticsService;

    private FavoriteStoreServiceImpl favoriteService;
    private SavedPromotionServiceImpl savedService;

    @BeforeEach
    void setUp() {
        favoriteRepository = mock(IFavoriteStoreRepository.class);
        savedRepository = mock(ISavedPromotionRepository.class);
        userService = mock(IUserService.class);
        analyticsService = mock(IAnalyticsService.class);

        favoriteService = new FavoriteStoreServiceImpl(favoriteRepository);
        savedService = new SavedPromotionServiceImpl(savedRepository, userService, analyticsService);
    }

    @Test
    void heartingAnAlreadyHeartedStoreAnswersWithTheExistingRow() {
        when(favoriteRepository.findByUserAndStore("user-1", "store-1"))
                .thenReturn(List.of(favorite("fav-existing", "user-1", "store-1")));

        FavoriteStore result = favoriteService.create(favorite(null, "user-1", "store-1"));

        assertThat(result.getFavoriteStoreID()).isEqualTo("fav-existing");
        verify(favoriteRepository, never()).save(any(FavoriteStore.class));
    }

    @Test
    void heartingANewStoreWritesTheRow() {
        when(favoriteRepository.findByUserAndStore("user-1", "store-1")).thenReturn(List.of());

        favoriteService.create(favorite(null, "user-1", "store-1"));

        verify(favoriteRepository, times(1)).save(any(FavoriteStore.class));
    }

    @Test
    void duplicatesAlreadyInTheTableCollapseOntoTheFirstRow() {
        // A table that already holds two rows for one pair — what the unguarded insert
        // produced. Answering with one of them means the client holds one row id, so the
        // unsave that follows can act on a known row instead of leaving one behind.
        when(favoriteRepository.findByUserAndStore("user-1", "store-1")).thenReturn(List.of(
                favorite("fav-first", "user-1", "store-1"),
                favorite("fav-second", "user-1", "store-1")));

        assertThat(favoriteService.create(favorite(null, "user-1", "store-1")).getFavoriteStoreID())
                .isEqualTo("fav-first");
        verify(favoriteRepository, never()).save(any(FavoriteStore.class));
    }

    @Test
    void reBookmarkingAnAlreadyBookmarkedDealAnswersWithTheExistingRow() {
        when(savedRepository.findByUserAndPromotion("user-1", "deal-1"))
                .thenReturn(List.of(savedPromotion("save-existing", "user-1", "deal-1")));

        SavedPromotion result = savedService.create(savedPromotion(null, "user-1", "deal-1"));

        assertThat(result.getSavedPromotionID()).isEqualTo("save-existing");
        verify(savedRepository, never()).save(any(SavedPromotion.class));
        // Already saved, so it is not a new save: no points, no analytics event.
        verify(userService, never()).addPoints(anyString(), anyInt());
        verify(analyticsService, never()).recordEvent(any(), any(), any(), any());
    }

    @Test
    void reBookmarkingIsNotRefusedByTheFreePlanCap() {
        // A free user re-saves a deal they already hold. The pair check answers first, so
        // this is not counted and not refused — the cap only guards genuinely new saves.
        when(savedRepository.findByUserAndPromotion("user-1", "deal-1"))
                .thenReturn(List.of(savedPromotion("save-existing", "user-1", "deal-1")));

        assertThat(savedService.create(savedPromotion(null, "user-1", "deal-1"))).isNotNull();
        verify(userService, never()).read("user-1");
    }

    @Test
    void bookmarkingANewDealStillRespectsTheFreePlanCap() {
        // The pair check must not become a way around the cap: a free user who already
        // holds ten deals and asks to save an eleventh is still refused, and the
        // controller turns this null into 402.
        when(savedRepository.findByUserAndPromotion("user-1", "deal-11")).thenReturn(List.of());
        when(userService.read("user-1"))
                .thenReturn(new User.Builder().setUserID("user-1").setPlanTier(UserPlanTier.FREE).build());
        when(savedRepository.findByUser_UserID("user-1")).thenReturn(tenAlreadySavedDeals());

        assertThat(savedService.create(savedPromotion(null, "user-1", "deal-11"))).isNull();
        verify(savedRepository, never()).save(any(SavedPromotion.class));
    }

    @Test
    void aPlusUserIsStillChargedForGenuinelyNewSaves() {
        // The other half of the cap: without the guard the pair check would swallow every
        // save for a user whose plan lookup failed.
        when(savedRepository.findByUserAndPromotion("user-1", "deal-1")).thenReturn(List.of());
        when(userService.read("user-1"))
                .thenReturn(new User.Builder().setUserID("user-1").setPlanTier(UserPlanTier.PLUS).build());
        when(savedRepository.findByUser_UserID("user-1")).thenReturn(tenAlreadySavedDeals());
        when(savedRepository.save(any(SavedPromotion.class)))
                .thenAnswer(call -> call.getArgument(0));

        SavedPromotion result = savedService.create(savedPromotion(null, "user-1", "deal-1"));

        assertThat(result).isNotNull();
        verify(savedRepository, times(1)).save(any(SavedPromotion.class));
        verify(userService, times(1)).addPoints(eq("user-1"), eq(5));
    }

    /** Exactly the free-plan limit, so the eleventh is over it. */
    private List<SavedPromotion> tenAlreadySavedDeals() {
        return IntStream.rangeClosed(1, 10)
                .mapToObj(i -> savedPromotion("save-" + i, "user-1", "deal-" + i))
                .toList();
    }

    private FavoriteStore favorite(String id, String userId, String storeId) {
        return new FavoriteStore.Builder()
                .setFavoriteStoreID(id)
                .setUser(new User.Builder().setUserID(userId).build())
                .setStore(new Store.Builder().setStoreId(storeId).build())
                .build();
    }

    private SavedPromotion savedPromotion(String id, String userId, String promotionId) {
        return new SavedPromotion.Builder()
                .setSavedPromotionID(id)
                .setUser(new User.Builder().setUserID(userId).build())
                .setPromotion(new Promotion.Builder().setPromotionID(promotionId).build())
                .build();
    }
}
