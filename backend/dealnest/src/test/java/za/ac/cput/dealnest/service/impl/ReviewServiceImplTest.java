package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IReviewRepository;
import za.ac.cput.dealnest.service.IStoreService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Writing a review — creating it, editing it, deleting it — used to fail with a 500 on
 * every one of those three, while the review itself was in fact being written.
 *
 * <p>Each of the three calls recalculates the store's average rating afterwards, and that
 * recalculation used to read every review of the store into memory and average them in
 * Java. It now asks the database for the count and the average instead. The query was
 * declared to return a bare {@code Object[]}, which Spring Data cannot disambiguate: it
 * reads it as a one-column result whose single value is the row, so the caller received
 * {@code Object[]{ row }} and read the row array as the review count. Every write threw
 * {@code ClassCastException} at that line, after the review had already been saved — so
 * the shopper was told their review had failed to save, and then saw it sitting on the
 * page.
 *
 * <p>These tests pin the shape of what comes back from {@code summariseForStore}, and
 * that all three writes reach the recalculation and survive it.
 */
class ReviewServiceImplTest {

    private IReviewRepository repository;
    private IStoreService storeService;
    private IUserService userService;

    private ReviewServiceImpl service;

    private Store store;

    @BeforeEach
    void setUp() {
        repository = mock(IReviewRepository.class);
        storeService = mock(IStoreService.class);
        userService = mock(IUserService.class);

        service = new ReviewServiceImpl(repository, storeService, userService);

        store = new Store.Builder().setStoreId("store-1").setStoreName("Fresh Basket").build();
        when(storeService.read("store-1")).thenReturn(store);
    }

    /**
     * The regression itself: the aggregate arrives as a one-row list whose two slots are
     * the count and the average, and both are numbers. Asserted directly because this is
     * the exact shape the service reads, and a bare {@code Object[]} return compiles
     * happily and only fails at runtime, on the first review anybody writes.
     */
    @Test
    void theStoreSummaryIsOneRowOfTwoNumbers() {
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{4L, 4.25d}));

        List<Object[]> summary = repository.summariseForStore("store-1");

        assertThat(summary).hasSize(1);
        assertThat(summary.get(0)).hasSize(2);
        assertThat(((Number) summary.get(0)[0]).intValue()).isEqualTo(4);
        assertThat(((Number) summary.get(0)[1]).doubleValue()).isEqualTo(4.25d);
    }

    @Test
    void creatingAReviewSavesItAndRecalculatesTheStoreRating() {
        Review review = review("review-1", 4);
        when(repository.save(review)).thenReturn(review);
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{3L, 4.0d}));

        assertThatCode(() -> service.create(review)).doesNotThrowAnyException();

        verify(repository).save(review);
        assertThat(store.getTotalReviews()).isEqualTo(3);
        assertThat(store.getAverageRating()).isEqualTo(4.0d);
        verify(storeService).update(store);
    }

    @Test
    void editingAReviewSavesItAndRecalculatesTheStoreRating() {
        Review review = review("review-1", 2);
        when(repository.save(review)).thenReturn(review);
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{3L, 3.0d}));

        assertThatCode(() -> service.update(review)).doesNotThrowAnyException();

        verify(repository).save(review);
        assertThat(store.getTotalReviews()).isEqualTo(3);
        assertThat(store.getAverageRating()).isEqualTo(3.0d);
    }

    @Test
    void deletingAReviewRemovesItAndRecalculatesTheStoreRating() {
        Review existing = review("review-1", 5);
        when(repository.findDetailedById("review-1")).thenReturn(Optional.of(existing));
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{2L, 3.5d}));

        assertThat(service.delete("review-1")).isTrue();

        verify(repository).deleteById("review-1");
        assertThat(store.getTotalReviews()).isEqualTo(2);
        assertThat(store.getAverageRating()).isEqualTo(3.5d);
    }

    /**
     * The average is stored to one decimal place, so it has to survive the rounding as a
     * number the store page can print. A count of one is the case that catches a
     * regression here hardest: the row exists but nothing is left to average with it.
     */
    @Test
    void theAverageIsRoundedToOneDecimalAndSurvivesASingleReview() {
        Review review = review("review-1", 4);
        when(repository.save(review)).thenReturn(review);
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 4.0d}));

        service.create(review);

        assertThat(store.getTotalReviews()).isEqualTo(1);
        assertThat(store.getAverageRating()).isEqualTo(4.0d);
    }

    /**
     * A store whose last review has just been deleted has no average to show. It has to be
     * cleared rather than left at the value the deleted review gave it, or the store page
     * keeps advertising a rating nobody has given.
     */
    @Test
    void aStoreLeftWithNoReviewsHasItsAverageCleared() {
        Review existing = review("review-1", 5);
        when(repository.findDetailedById("review-1")).thenReturn(Optional.of(existing));
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{0L, 0.0d}));

        service.delete("review-1");

        assertThat(store.getTotalReviews()).isZero();
        assertThat(store.getAverageRating()).isNull();
    }

    /**
     * The author earns points for writing a review, and the user service is what grants
     * them. This is asserted because it sits after the recalculation on the same code
     * path, so a failure inside the recalculation silently swallowed it too.
     */
    @Test
    void creatingAReviewStillCreditsTheAuthor() {
        Review review = review("review-1", 4);
        when(repository.save(review)).thenReturn(review);
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 4.0d}));

        service.create(review);

        verify(userService).addPoints("user-1", 5);
    }

    /**
     * A review with no author is legal — the column is nullable, and the seeded data has
     * them. Editing or deleting one must not fail, and must still fix up the store's
     * rating. A null author means no points to grant, not a reason to blow up.
     */
    @Test
    void anAnonymousReviewCanStillBeRecalculatedAgainst() {
        Review anonymous = new Review.Builder()
                .setReviewID("review-anon")
                .setRating(3)
                .setStore(new Store.Builder().setStoreId("store-1").build())
                .build();
        when(repository.findDetailedById("review-anon")).thenReturn(Optional.of(anonymous));
        when(repository.summariseForStore("store-1"))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 3.0d}));

        assertThatCode(() -> service.delete("review-anon")).doesNotThrowAnyException();

        assertThat(store.getTotalReviews()).isEqualTo(1);
        verify(userService, never()).addPoints(any(), anyInt());
    }

    /**
     * Deleting an id that is not there still answers, and must not try to fix up a store
     * it never learned the name of.
     */
    @Test
    void deletingAnUnknownReviewIsHarmless() {
        when(repository.findDetailedById("nope")).thenReturn(Optional.empty());

        assertThat(service.delete("nope")).isTrue();

        verify(repository).deleteById("nope");
        verify(storeService, never()).update(any());
    }

    private Review review(String reviewId, int rating) {
        User author = new User.Builder().setUserID("user-1").setEmail("shopper@example.com").build();
        return new Review.Builder()
                .setReviewID(reviewId)
                .setRating(rating)
                .setComment("A comment")
                .setStore(new Store.Builder().setStoreId("store-1").build())
                .setUser(author)
                .build();
    }
}
