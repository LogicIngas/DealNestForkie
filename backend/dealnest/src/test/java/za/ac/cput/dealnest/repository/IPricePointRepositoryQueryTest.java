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
import za.ac.cput.dealnest.dto.PricePointDTO;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Guards the price history projections, which are JPQL constructor expressions rather
 * than entities.
 *
 * <p>{@code select new ...PricePointDTO(...)} is only checked by Hibernate when the
 * statement is built, so a DTO whose constructor no longer matches the three columns the
 * queries pass compiles cleanly and then fails the first time a price history is
 * requested — after deploy, on a screen nobody exercises in a smoke test. Binding the
 * repository here makes both queries build against a real H2 dialect.
 *
 * <p>The entity assertion matters as much as the values. Both queries exist to draw a
 * sparkline straight from three columns; if a PricePoint entity or a lazy Promotion were
 * hydrated instead, this would still return the right prices while reintroducing the
 * per-row round trips the projection was written to avoid.
 *
 * <p>Rows are inserted with {@link JdbcTemplate} for the same reason as
 * {@link IPromotionRepositoryQueryTest}: these entities use hand-assigned String
 * identifiers, so Spring Data's {@code save} would route every insert to {@code merge}.
 * Plain inserts sidestep that; this test only ever reads.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
class IPricePointRepositoryQueryTest {

    @Autowired
    private IPricePointRepository pricePointRepository;

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
    void oneDealsHistoryComesBackOldestFirstAsProjectedColumns() {
        seed();
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-late", 60.0d, Timestamp.valueOf("2024-03-01 09:00:00"), "deal-1");
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-early", 90.0d, Timestamp.valueOf("2024-01-01 09:00:00"), "deal-1");
        entityManager.clear();

        List<PricePointDTO> history = pricePointRepository.findHistoryForPromotion("deal-1");

        assertEquals(2, history.size());
        assertEquals(List.of(90.0d, 60.0d), history.stream().map(PricePointDTO::getPrice).toList(),
                "oldest first — a sparkline drawn in the wrong direction would read as the "
                        + "price moving when it only moved backwards");
        assertEquals("deal-1", history.get(0).getPromotionID(),
                "the projection must carry the deal it belongs to");
        assertNotNull(history.get(0).getRecordedAt());
    }

    @Test
    void aStoresHistoryCoversEveryDealAndExcludesOtherStores() {
        seed();
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-1", 50.0d, Timestamp.valueOf("2024-01-01 09:00:00"), "deal-1");
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-2", 30.0d, Timestamp.valueOf("2024-01-02 09:00:00"), "other-deal");
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-3", 70.0d, Timestamp.valueOf("2024-01-03 09:00:00"), "deal-2");
        entityManager.clear();

        List<PricePointDTO> history = pricePointRepository.findHistoryForStore("store-1");

        assertEquals(List.of("deal-1", "other-deal"),
                history.stream().map(PricePointDTO::getPromotionID).toList(),
                "one store's whole history in one call, both of its deals grouped together, "
                        + "and the other store's deal left out");
    }

    @Test
    void readingPriceHistoryLoadsNoEntities() {
        seed();
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-1", 50.0d, Timestamp.valueOf("2024-01-01 09:00:00"), "deal-1");
        jdbc.update("insert into price_points (price_pointid, price, recorded_at, promotion_id) values (?, ?, ?, ?)",
                "pp-2", 40.0d, Timestamp.valueOf("2024-01-02 09:00:00"), "deal-1");
        entityManager.clear();

        Statistics statistics = statistics();
        statistics.clear();

        List<PricePointDTO> history = pricePointRepository.findHistoryForStore("store-1");
        history.forEach(point -> assertNotNull(point.getRecordedAt()));

        assertEquals(1, statistics.getQueryExecutionCount(),
                "a store page's sparklines must arrive in a single statement");
        assertEquals(0, statistics.getEntityLoadCount(),
                "this must stay a scalar projection: a managed PricePoint here would be "
                        + "dirty-checked, and its lazy Promotion would be a query per point");
    }

    private Statistics statistics() {
        return entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
    }

    /**
     * Two owners, two stores, three deals, so the store-wide query has to actually
     * separate stores and the group-by key has more than one value to hold.
     */
    private void seed() {
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

            jdbc.update("insert into promotions (promotionid, title, store_id, is_active) values (?, ?, ?, ?)",
                    "deal-" + i, "Deal " + i, "store-" + i, Boolean.TRUE);
        }

        // A third deal on the first store. The store-wide query has to return more than
        // one key, and deal-2 on the second store is what it has to leave out.
        jdbc.update("insert into promotions (promotionid, title, store_id, is_active) values (?, ?, ?, ?)",
                "other-deal", "Another Deal", "store-1", Boolean.TRUE);
    }
}
