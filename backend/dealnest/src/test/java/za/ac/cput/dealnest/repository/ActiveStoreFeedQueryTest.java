package za.ac.cput.dealnest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import za.ac.cput.dealnest.domain.Store;

import javax.sql.DataSource;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The bounded home feed.
 *
 * <p>{@link IStoreRepository#findActive(org.springframework.data.domain.Pageable)} replaced
 * a call that read the whole store table — every owner attached — so the home page could
 * keep the first few rows. Three things about the replacement are load-bearing and none of
 * them are visible from the controller, so they are pinned here:
 *
 * <ul>
 *   <li>It filters on the active flag. The old call did not; the browser did, after
 *       serialising everything. A closed store appearing in the feed is the regression
 *       this guards.</li>
 *   <li>It stops at the limit instead of returning the table.</li>
 *   <li>Its order is <em>total</em>. Ratings tie constantly, so a cap over a
 *       non-deterministic order means two visits can show two different sets of stores.</li>
 * </ul>
 *
 * <p>Runs on H2 like the other repository tests, because this is the one query in the
 * change whose correctness cannot be established by mocking: JPQL that does not parse and
 * ordering that does not hold are both invisible until a real database executes them. The
 * full-context {@code DealnestApplicationTests} needs a live Postgres, so this deliberately
 * does not.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
class ActiveStoreFeedQueryTest {

    @Autowired
    private IStoreRepository storeRepository;

    @Autowired
    private DataSource dataSource;

    @PersistenceContext
    private EntityManager entityManager;

    private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc = new JdbcTemplate(dataSource);
    }

    @Test
    void theFeedIsHighestRatedFirst() {
        seedOwner("owner-1");
        insertStore("store-low", "Low", "owner-1", true, 2.0d);
        insertStore("store-high", "High", "owner-1", true, 4.5d);
        insertStore("store-mid", "Mid", "owner-1", true, 3.5d);
        entityManager.clear();

        List<Store> found = storeRepository.findActive(PageRequest.ofSize(12));

        assertEquals(List.of("store-high", "store-mid", "store-low"), idsOf(found));
    }

    @Test
    void aClosedStoreIsNotInTheFeed() {
        seedOwner("owner-1");
        insertStore("store-open", "Open", "owner-1", true, 4.0d);
        insertStore("store-shut", "Shut", "owner-1", false, 5.0d);
        entityManager.clear();

        List<Store> found = storeRepository.findActive(PageRequest.ofSize(12));

        // The shut store out-rates the open one, so this fails if the predicate is gone
        // rather than merely if the order is wrong.
        assertEquals(List.of("store-open"), idsOf(found));
    }

    @Test
    void anUnratedStoreSortsAfterEveryRatedOne() {
        seedOwner("owner-1");
        insertStore("store-rated", "Rated", "owner-1", true, 1.0d);
        insertStore("store-unrated", "Unrated", "owner-1", true, null);
        entityManager.clear();

        List<Store> found = storeRepository.findActive(PageRequest.ofSize(12));

        // "nulls last" is not the default for either Postgres or H2, both of which treat a
        // null as the largest value in an ascending sort — which under "desc" would put
        // every unrated store at the front of the feed, above a five-star one.
        assertEquals(List.of("store-rated", "store-unrated"), idsOf(found));
    }

    @Test
    void tiedRatingsAreBrokenByStoreIdSoTheCapIsRepeatable() {
        seedOwner("owner-1");
        insertStore("store-c", "C", "owner-1", true, 4.0d);
        insertStore("store-a", "A", "owner-1", true, 4.0d);
        insertStore("store-b", "B", "owner-1", true, 4.0d);
        entityManager.clear();

        // Capped at two out of three tied rows. Whichever two come back, it has to be the
        // same two every time — otherwise the home page shows a different pair of stores
        // on each visit, and the rest of the directory appears to change at random.
        assertEquals(List.of("store-a", "store-b"), idsOf(storeRepository.findActive(PageRequest.ofSize(2))));
        assertEquals(List.of("store-a", "store-b"), idsOf(storeRepository.findActive(PageRequest.ofSize(2))));
    }

    @Test
    void theFeedStopsAtTheLimitInsteadOfReturningTheTable() {
        seedOwner("owner-1");
        for (int i = 1; i <= 8; i++) {
            insertStore(String.format("store-%02d", i), "Store " + i, "owner-1", true, 3.0d);
        }
        entityManager.clear();

        assertEquals(3, storeRepository.findActive(PageRequest.ofSize(3)).size());
        assertEquals(8, storeRepository.findActive(PageRequest.ofSize(12)).size(),
                "a limit above the row count returns everything rather than erroring");
    }

    @Test
    void theOwnerIsFetchedWithTheStore() {
        seedOwner("owner-1");
        insertStore("store-1", "Store 1", "owner-1", true, 4.0d);
        entityManager.clear();

        Store found = storeRepository.findActive(PageRequest.ofSize(1)).get(0);
        entityManager.clear();

        // Store is serialised to JSON with its owner attached and the association is a lazy
        // to-one, so an unfetched owner costs one query per row in the feed — the feed is
        // called on every home-page load, so that is twelve extra queries. Clearing the
        // session first means reading the owner can only succeed if the row really did
        // come back with it.
        assertNotNull(found.getUser(), "the owner must be fetched, or every card costs another query");
        assertEquals("owner-1", found.getUser().getUserID());
    }

    @Test
    void aMissingOwnerDoesNotStopTheFeed() {
        // The join is an inner one, so a store row with a dangling/null owner is dropped
        // rather than breaking the whole feed. A store with no owner is also not a card
        // anyone can render usefully — there is nothing to attribute it to — so losing it
        // is the right outcome; what must not happen is the page erroring out.
        seedOwner("owner-1");
        insertStore("store-owned", "Owned", "owner-1", true, 4.0d);
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category,
                                    is_active, is_verified, total_reviews,
                                    latitude, longitude)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                "store-orphan", "Orphan", null, "RESTAURANT",
                Boolean.TRUE, Boolean.TRUE, 0, 0.0d, 0.0d);
        entityManager.clear();

        List<Store> found = storeRepository.findActive(PageRequest.ofSize(12));

        assertEquals(List.of("store-owned"), idsOf(found));
    }

    @Test
    void anOwnerlessFeedIsEmptyRatherThanFailing() {
        entityManager.clear();

        assertTrue(storeRepository.findActive(PageRequest.ofSize(12)).isEmpty());
    }

    @Test
    void aZeroSizedPageIsRejectedRatherThanSilentlyReturningEverything() {
        seedOwner("owner-1");
        insertStore("store-1", "Store 1", "owner-1", true, 4.0d);
        entityManager.clear();

        // This is why the controller maps a non-positive limit to the ceiling rather than
        // passing it through: PageRequest.ofSize(0) is an IllegalArgumentException, and a
        // caller sending ?limit=0 would get a 500 from a parameter that is supposed to
        // mean "the smallest sensible page".
        assertThrows(IllegalArgumentException.class, () -> PageRequest.ofSize(0));
    }

    // -----------------------------------------------------------------------

    private void seedOwner(String userId) {
        jdbc.update("""
                insert into users (userid, email, first_name, last_name, password,
                                   is_active, current_streak, longest_streak,
                                   latitude, longitude)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                userId,
                userId + "@example.com",
                "Owner",
                "Person",
                "irrelevant-for-this-test",
                Boolean.TRUE, 0, 0, 0.0d, 0.0d);
    }

    private void insertStore(String storeId, String name, String ownerId, boolean active, Double rating) {
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category,
                                    is_active, is_verified, total_reviews,
                                    average_rating, latitude, longitude)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                storeId,
                name,
                ownerId,
                "RESTAURANT",
                active,
                Boolean.TRUE,
                0,
                rating,
                0.0d,
                0.0d);
    }

    private static List<String> idsOf(List<Store> stores) {
        return stores.stream().map(Store::getStoreId).toList();
    }
}
