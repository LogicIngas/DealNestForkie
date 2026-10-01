package za.ac.cput.dealnest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import za.ac.cput.dealnest.domain.Review;

import javax.sql.DataSource;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A store's review list is read for two reasons: it is what the store page draws, and it
 * is how the page decides whether to offer the shopper the "write a review" button. Both
 * answers have to include every review of that store.
 *
 * <p>These queries join-fetch the store, the store's owner and the review's author so that
 * Jackson does not fire a query per row on the way out. The joins were written as inner
 * joins, and both owner columns are nullable — {@code reviews.user_id} in particular — so
 * an authorless review was dropped from the list entirely. The visible symptom was that a
 * shopper who had genuinely written a review saw no sign of it and was offered the form
 * again, on a store that plainly had reviews on it.
 *
 * <p>The store itself stays an inner join because its column is NOT NULL, so it can never
 * drop a row; that is asserted too, so the narrowing cannot be copied across later without
 * a test noticing.
 *
 * <p>Rows are inserted with {@link JdbcTemplate} because these entities use hand-assigned
 * String identifiers, which are never null and so route every {@code save} to
 * {@code merge}, which then fails against a table with no matching row. This test reads;
 * it never persists.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
class IReviewRepositoryQueryTest {

    @Autowired
    private IReviewRepository reviewRepository;

    @Autowired
    private DataSource dataSource;

    @PersistenceContext
    private EntityManager entityManager;

    private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc = new JdbcTemplate(dataSource);
    }

    /**
     * The regression: a review whose author column is null is still a review of the store,
     * and has to appear on the store's page.
     */
    @Test
    void aReviewWithNoAuthorStillAppearsOnTheStorePage() {
        seedOneStoreWithAnOwner();
        insertReview("review-anon", 3, null);
        insertReview("review-signed", 5, "shopper-1");
        entityManager.clear();

        List<Review> reviews = reviewRepository.findByStore_StoreId("store-1");

        assertEquals(List.of("review-anon", "review-signed"),
                reviews.stream().map(Review::getReviewID).sorted().toList(),
                "an inner join on the author would drop review-anon here, which is the whole "
                        + "bug: the shopper sees a store with reviews and no sign of their own");
        assertNull(reviews.stream().filter(r -> r.getReviewID().equals("review-anon"))
                        .findFirst().orElseThrow().getUser(),
                "and it comes back with the author it actually has — null, not a broken proxy");
    }

    /**
     * The same has to hold for a store with no owner on file, since that column is
     * nullable too.
     */
    @Test
    void aStoreWithNoOwnerStillShowsItsReviews() {
        insertUser("ownerless-owner", "owner@example.com");
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category, is_active,
                                    is_verified, total_reviews, latitude, longitude)
                values (?, ?, null, 'GROCERY', ?, ?, 0, 0.0, 0.0)
                """, "store-1", "Ownerless Grocer", Boolean.TRUE, Boolean.FALSE);
        insertReview("review-1", 4, null);
        entityManager.clear();

        List<Review> reviews = reviewRepository.findByStore_StoreId("store-1");

        assertEquals(1, reviews.size());
        assertNull(reviews.get(0).getStore().getUser(),
                "the store comes back with the owner it actually has");
    }

    /**
     * Only that store's reviews, so a review cannot be edited or deleted by id found
     * through some other store's page.
     */
    @Test
    void onlyThatStoresReviewsComeBack() {
        seedOneStoreWithAnOwner();
        insertReview("review-1", 4, "shopper-1");
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category, is_active,
                                    is_verified, total_reviews, latitude, longitude)
                values (?, ?, ?, 'GROCERY', ?, ?, 0, 0.0, 0.0)
                """, "store-2", "Another Grocer", "owner-1", Boolean.TRUE, Boolean.TRUE);
        insertReview("review-2", 2, "shopper-1", "store-2");
        entityManager.clear();

        assertEquals(List.of("review-1"),
                reviewRepository.findByStore_StoreId("store-1").stream()
                        .map(Review::getReviewID).toList());
    }

    /**
     * The reason the joins exist at all. Every join here is to a to-one, so no row is
     * duplicated, and everything Jackson touches is already loaded.
     */
    @Test
    void loadingAStoresReviewsDoesNotQueryOncePerReview() {
        seedOneStoreWithAnOwner();
        for (int i = 1; i <= 3; i++) {
            insertReview("review-" + i, 4, "shopper-" + i);
        }
        entityManager.clear();

        Statistics statistics = statistics();
        statistics.clear();

        List<Review> reviews = reviewRepository.findByStore_StoreId("store-1");
        assertEquals(3, reviews.size());

        // Exactly what Jackson does while writing the response body.
        reviews.forEach(review -> {
            assertNotNull(review.getStore().getStoreName());
            assertNotNull(review.getStore().getUser().getFirstName());
            assertNotNull(review.getUser().getFirstName());
        });

        assertEquals(1, statistics.getQueryExecutionCount(),
                "the list must arrive in a single statement");
        assertEquals(0, statistics.getEntityFetchCount(),
                "the store, its owner and the author must already be loaded: any fetch here "
                        + "means Jackson triggered a query per review while serialising");
    }

    /**
     * A single review is read by id on the update and delete paths, to check the caller
     * owns it. That read has to carry the same attached associations, or the ownership
     * check itself triggers a lazy load per request.
     */
    @Test
    void readingOneReviewByIdComesBackFullyAttached() {
        seedOneStoreWithAnOwner();
        insertReview("review-1", 4, "shopper-1");
        entityManager.clear();

        Statistics statistics = statistics();
        statistics.clear();

        Review review = reviewRepository.findDetailedById("review-1").orElseThrow();
        assertNotNull(review.getUser().getFirstName());
        assertNotNull(review.getStore().getUser().getFirstName());

        assertEquals(1, statistics.getQueryExecutionCount());
        assertEquals(0, statistics.getEntityFetchCount());
    }

    /**
     * An id that is not there has to come back empty rather than as a review with nothing
     * on it, because the controller reads this to decide whether the review exists before
     * it checks who is allowed to touch it.
     */
    @Test
    void readingAnUnknownReviewFindsNothing() {
        assertTrue(reviewRepository.findDetailedById("nope").isEmpty());
    }

    /**
     * The count and average behind the store's star rating, which is recalculated on every
     * review write. The shape is the point: one row, count then average, both numbers.
     * A bare {@code Object[]} return is ambiguous to Spring Data and arrives as
     * {@code Object[]{ row }}, which is what made every review write fail.
     */
    @Test
    void theStoreSummaryIsOneRowOfCountThenAverage() {
        seedOneStoreWithAnOwner();
        insertReview("review-1", 4, "shopper-1");
        insertReview("review-2", 5, "shopper-1");
        entityManager.clear();

        List<Object[]> summary = reviewRepository.summariseForStore("store-1");

        assertEquals(1, summary.size(), "an aggregate is always exactly one row");
        assertEquals(2, summary.get(0).length, "count, then average");
        assertEquals(2L, ((Number) summary.get(0)[0]).longValue());
        assertEquals(4.5d, ((Number) summary.get(0)[1]).doubleValue(), 0.0001d);
    }

    /**
     * A store nobody has reviewed yet still produces a row, with a count of zero. If it
     * produced nothing, the caller would have to invent those numbers, and a store with no
     * reviews is exactly the case where the average has to be cleared.
     */
    @Test
    void aStoreWithNoReviewsStillSummarisesToZero() {
        seedOneStoreWithAnOwner();
        entityManager.clear();

        List<Object[]> summary = reviewRepository.summariseForStore("store-1");

        assertEquals(1, summary.size(), "no rows must not mean no result row");
        assertEquals(0L, ((Number) summary.get(0)[0]).longValue());
    }

    /**
     * A review with no rating is counted as a zero, not skipped. SQL's {@code avg} ignores
     * nulls, so an unrated review would otherwise lift the store's average instead of
     * dragging it down — the opposite of what the Java average it replaced did.
     */
    @Test
    void anUnratedReviewCountsAsAZeroRatherThanBeingSkipped() {
        seedOneStoreWithAnOwner();
        insertReview("review-rated", 5, "shopper-1");
        insertReview("review-unrated", null, "shopper-1");
        entityManager.clear();

        List<Object[]> summary = reviewRepository.summariseForStore("store-1");

        assertEquals(2L, ((Number) summary.get(0)[0]).longValue(),
                "both reviews exist, so both are counted");
        assertEquals(2.5d, ((Number) summary.get(0)[1]).doubleValue(), 0.0001d,
                "5 and a zero average to 2.5, not to 5");
    }

    private Statistics statistics() {
        return entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
    }

    private void seedOneStoreWithAnOwner() {
        insertUser("owner-1", "owner@example.com");
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category, is_active,
                                    is_verified, total_reviews, latitude, longitude)
                values (?, ?, ?, 'GROCERY', ?, ?, 0, 0.0, 0.0)
                """, "store-1", "Fresh Basket", "owner-1", Boolean.TRUE, Boolean.TRUE);
    }

    /**
     * Idempotent, because several of these seed more than one review by the same shopper
     * and the point of those tests is what the store's list and summary do with several
     * rows, not with several accounts.
     */
    private void insertUser(String userId, String email) {
        Integer existing = jdbc.queryForObject(
                "select count(*) from users where userid = ?", Integer.class, userId);
        if (existing != null && existing > 0) {
            return;
        }
        jdbc.update("""
                insert into users (userid, email, first_name, last_name, password,
                                   is_active, current_streak, longest_streak,
                                   latitude, longitude)
                values (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0.0)
                """,
                userId, email, "Person-" + userId, "Test",
                "irrelevant-for-this-test", Boolean.TRUE, 0, 0);
    }

    private void insertReview(String reviewId, Integer rating, String userId) {
        insertReview(reviewId, rating, userId, "store-1");
    }

    private void insertReview(String reviewId, Integer rating, String userId, String storeId) {
        if (userId != null) {
            insertUser(userId, userId + "@example.com");
        }
        jdbc.update("""
                insert into reviews (reviewid, rating, comment, store_id, user_id)
                values (?, ?, ?, ?, ?)
                """, reviewId, rating, "A comment", storeId, userId);
    }
}
