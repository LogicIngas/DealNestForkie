package za.ac.cput.dealnest.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.service.IPromotionService;
import za.ac.cput.dealnest.service.IStoreService;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * The feed's {@code limit} is the one number that decides whether the home page is
 * cheap or the whole catalogue is shipped to it, so the two edge cases matter more than
 * the middle.
 *
 * <p>Zero (and below) is not a mistake to be corrected — Explore genuinely needs every
 * active deal to work out which stores have a live one — so it has to keep reaching the
 * service as "all". Everything positive has to reach it no larger than the ceiling,
 * otherwise the parameter is only a suggestion and {@code ?limit=2000000000} restores
 * exactly the request this work removed.
 */
class PromotionFeedLimitTest {

    private IPromotionService promotionService;
    private PromotionController controller;

    @BeforeEach
    void setUp() {
        promotionService = mock(IPromotionService.class);
        controller = new PromotionController(promotionService, mock(IStoreService.class));
    }

    @Test
    void anOversizedLimitIsClampedToTheCeiling() {
        controller.findByIsActiveTrue(Integer.MAX_VALUE);

        verify(promotionService).findByIsActiveTrue(PromotionController.MAX_PAGE_SIZE);
    }

    @Test
    void zeroStillAsksForTheWholeFeed() {
        controller.findByIsActiveTrue(0);

        verify(promotionService).findByIsActiveTrue(0);
    }

    @Test
    void aNegativeLimitAlsoMeansTheWholeFeed() {
        controller.findByIsActiveTrue(-1);

        verify(promotionService).findByIsActiveTrue(0);
    }

    @Test
    void anOrdinaryLimitIsPassedThroughUnchanged() {
        controller.findByIsActiveTrue(6);

        verify(promotionService).findByIsActiveTrue(6);
    }
}
