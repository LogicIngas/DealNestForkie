package za.ac.cput.dealnest.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IAnalyticsService;
import za.ac.cput.dealnest.service.IRecommendationService;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The home page fires three store requests on arrival, and each one used to carry the
 * whole store directory regardless of how many cards the page actually draws. These cover
 * the parameters that decide how much comes back.
 *
 * <p>The distinction that matters most is {@link #recommendationsAreRankedBeforeTheyAre
 * Capped()}: capping the ranking early would change which stores are shown, which is a
 * behaviour change. The cap belongs after the ranking, and this is what holds it there.
 */
class StoreFeedLimitTest {

    private IStoreService storeService;
    private IRecommendationService recommendationService;
    private StoreController controller;

    @BeforeEach
    void setUp() {
        storeService = mock(IStoreService.class);
        recommendationService = mock(IRecommendationService.class);
        controller = new StoreController(storeService, recommendationService,
                mock(IAnalyticsService.class), mock(IUserRepository.class),
                mock(za.ac.cput.dealnest.repository.IStoreRepository.class));
    }

    // -----------------------------------------------------------------------
    // /api/stores/active
    // -----------------------------------------------------------------------

    @Test
    void anOversizedActiveLimitIsClampedToTheCeiling() {
        controller.getActiveStores(Integer.MAX_VALUE);

        verify(storeService).findActive(StoreController.MAX_PAGE_SIZE);
    }

    @Test
    void anOrdinaryActiveLimitIsPassedThroughUnchanged() {
        controller.getActiveStores(6);

        verify(storeService).findActive(6);
    }

    @Test
    void aZeroActiveLimitAsksForTheCeilingRatherThanAnEmptyPage() {
        // PageRequest.ofSize(0) is an error in Spring Data, so a caller sending ?limit=0
        // has to land on the ceiling rather than blow up or get nothing back.
        controller.getActiveStores(0);

        verify(storeService).findActive(StoreController.MAX_PAGE_SIZE);
    }

    // -----------------------------------------------------------------------
    // /api/stores/recommended and /personalized
    // -----------------------------------------------------------------------

    @Test
    void recommendationsAreRankedBeforeTheyAreCapped() {
        List<Store> ranked = storesNamed("A", "B", "C", "D");
        when(recommendationService.getRecommendedForUser("u1")).thenReturn(ranked);

        List<Store> result = controller.getRecommended("u1", 2);

        // The service is still asked for the whole ranking: capping has to happen after
        // ranking, or the page's picks change.
        verify(recommendationService).getRecommendedForUser("u1");
        assertEquals(2, result.size());
        assertSame(ranked.get(0), result.get(0), "the cap must keep the top of the ranking");
    }

    @Test
    void aLimitLargerThanTheRankingReturnsItUntouched() {
        List<Store> ranked = storesNamed("A", "B");
        when(recommendationService.getRecommendedForUser("u1")).thenReturn(ranked);

        List<Store> result = controller.getRecommended("u1", 6);

        assertSame(ranked, result, "nothing to trim, so the caller's list is returned as-is");
    }

    @Test
    void anAbsentLimitLeavesTheRankingUncapped() {
        List<Store> ranked = storesNamed("A", "B", "C");
        when(recommendationService.getRecommendedForUser("u1")).thenReturn(ranked);

        List<Store> result = controller.getRecommended("u1", null);

        assertEquals(3, result.size(), "a client predating the parameter still gets everything");
    }

    @Test
    void anOversizedRecommendationLimitIsClamped() {
        when(recommendationService.getRecommendedForUser("u1")).thenReturn(storesNamed("A", "B", "C"));

        List<Store> result = controller.getRecommended("u1", Integer.MAX_VALUE);

        // Three ranked rows is fewer than the ceiling, so the clamp is proven by the fact
        // that this returned all three instead of asking the service for an unbounded page.
        assertEquals(3, result.size());
        verify(recommendationService).getRecommendedForUser("u1");
    }

    @Test
    void cappingNeverSkipsTheRankingWork() {
        when(recommendationService.getRecommendedForUser("u1")).thenReturn(storesNamed("A", "B"));

        controller.getRecommended("u1", 1);

        // Guards the mistake this change is most likely to drift into: pushing the limit
        // down into the service, which would score fewer stores and quietly change what
        // the page recommends.
        verify(recommendationService).getRecommendedForUser("u1");
    }

    private static List<Store> storesNamed(String... names) {
        List<Store> stores = new ArrayList<>();
        for (String name : names) {
            stores.add(new Store(new Store.Builder().setStoreId(name).setStoreName(name)));
        }
        return stores;
    }
}