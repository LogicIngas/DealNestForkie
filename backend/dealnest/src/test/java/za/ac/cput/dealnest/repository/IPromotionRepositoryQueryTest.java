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
import za.ac.cput.dealnest.domain.Promotion;

import javax.sql.DataSource;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Guards against the deal feed going back to one query per row.
 *
 * <p>Promotion lists are returned as entities and serialised straight to JSON, so Jackson
 * walks promotion -&gt; store -&gt; store owner while writing the response. Both
 * associations used to be lazy with nothing to initialise them, which turned a feed of a
 * few dozen deals into a few hundred round trips to Postgres — slow enough to be visible
 * in the logs as a stream of repeated statements. Nothing about that is visible to a
 * test that only asserts on response contents, so the query count is asserted directly.
 *
 * <p>Rows are inserted with {@link JdbcTemplate} rather than saved through the
 * repositories. These entities use hand-assigned String identifiers, so they are not
 * {@code null} and Spring Data's {@code save} routes every one of them to {@code merge},
 * which then fails on a table with no matching row. Plain inserts sidestep that and are
 * all this test needs: it reads, it never persists.
 *
 * <p>The assertion that matters is {@code getEntityFetchCount}, not
 * {@code getQueryExecutionCount}. Lazy proxy initialisation issues its own selects and
 * is counted as an entity fetch; those selects are not reported as query executions, so
 * a test built on the query count alone passes happily against the exact N+1 it was
 * written to catch.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
class IPromotionRepositoryQueryTest {

    @Autowired
    private IPromotionRepository promotionRepository;

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
    void loadingTheDealFeedDoesNotQueryOncePerDeal() {
        seedTwoDealsWithDistinctStoresAndOwners();

        Statistics statistics = statistics();
        statistics.clear();

        List<Promotion> deals = promotionRepository.findByIsActiveTrue();
        assertEquals(2, deals.size(), "both seeded deals are active and should come back");

        // Exactly what Jackson does while writing the response body.
        deals.forEach(deal -> {
            assertNotNull(deal.getStore().getStoreName());
            assertNotNull(deal.getStore().getUser().getFirstName());
        });

        assertEquals(1, statistics.getQueryExecutionCount(),
                "the feed must arrive in a single statement");
        assertEquals(0, statistics.getEntityFetchCount(),
                "the store and its owner must already be loaded: any fetch here means Jackson "
                        + "triggered a query per deal while serialising");
    }

    @Test
    void loadingEveryDealAlsoAvoidsPerRowQueries() {
        seedTwoDealsWithDistinctStoresAndOwners();

        Statistics statistics = statistics();
        statistics.clear();

        List<Promotion> deals = promotionRepository.findAllWithStore();
        assertEquals(2, deals.size());

        deals.forEach(deal -> assertNotNull(deal.getStore().getUser().getFirstName()));

        assertEquals(1, statistics.getQueryExecutionCount(),
                "the unfiltered listing must be a single statement");
        assertEquals(0, statistics.getEntityFetchCount(),
                "the unfiltered listing must fetch the owner up front too");
    }

    private Statistics statistics() {
        return entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
    }

    /**
     * Two owners, two stores, two deals. Distinct owners and stores matter: if the query
     * joined on nothing, a repeated identifier would be served from the session cache and
     * the test would pass while production, where every row differs, still ran N+1.
     *
     * <p>Only the columns declared {@code not null} without a default are supplied, so the
     * insert stays valid if the entity gains an unrelated nullable field later.
     */
    private void seedTwoDealsWithDistinctStoresAndOwners() {
        for (int i = 1; i <= 2; i++) {
            jdbc.update("""
                    insert into users (userid, email, first_name, last_name, password,
                                       is_active, current_streak, longest_streak,
                                       latitude, longitude)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    "owner-" + i,
                    "owner" + i + "@example.com",
                    "Owner" + i,
                    "Person",
                    "irrelevant-for-this-test",
                    Boolean.TRUE, 0, 0, 0.0d, 0.0d);

            jdbc.update("""
                    insert into stores (store_id, store_name, user_id, category,
                                        is_active, is_verified, total_reviews,
                                        latitude, longitude)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    "store-" + i,
                    "Store " + i,
                    "owner-" + i,
                    "RESTAURANT",
                    Boolean.TRUE, Boolean.TRUE, 0, 0.0d, 0.0d);

            jdbc.update("""
                    insert into promotions (promotionid, title, store_id, is_active)
                    values (?, ?, ?, ?)
                    """,
                    "deal-" + i,
                    "Deal " + i,
                    "store-" + i,
                    Boolean.TRUE);
        }

        // Make sure nothing seeded here can be served from the session cache.
        entityManager.clear();
    }
}
