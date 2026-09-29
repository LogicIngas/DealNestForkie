package za.ac.cput.dealnest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.StoreCategory;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

        // The page the home page asks for: capped, and the cap is large enough here that
        // both seeded deals are inside it.
        List<Promotion> deals = promotionRepository.findByIsActiveTrue(PageRequest.ofSize(6));
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

    /**
     * The limit is the whole point of the change: the home page draws six cards, so a
     * catalogue of fifty deals must not be read, joined and serialised to produce them.
     *
     * <p>This is asserted on the rows that come back rather than on the SQL, because
     * what matters is that Postgres stopped early. Counting queries would not catch a
     * limit that was accepted and then ignored.
     */
    @Test
    void theFeedStopsAtTheLimitItWasGiven() {
        seedDealsForOrdering();
        seedExtraDeals(20);

        assertEquals(6, feedPage(6).size(),
                "Hot Deals draws six, so six rows is all the database should produce");
        assertEquals(25, promotionRepository.findAllActive().size(),
                "the unpaged feed still returns everything, for Explore");
    }

    /**
     * Capping the feed must not reorder it — "the first six" has to be the same six the
     * browser used to keep after slicing the full list it was sent.
     */
    @Test
    void theLimitedFeedIsTheLeadingRowsOfTheWholeFeed() {
        seedDealsForOrdering();

        List<String> whole = promotionRepository.findAllActive().stream()
                .map(Promotion::getTitle).toList();
        List<String> firstTwo = promotionRepository.findByIsActiveTrue(PageRequest.ofSize(2)).stream()
                .map(Promotion::getTitle).toList();

        assertEquals(whole.subList(0, 2), firstTwo,
                "a limited feed has to be a prefix of the full one, in the same order");
    }

    /**
     * The deals page used to render every match in one response. Now it walks pages, so
     * the floor and ceiling of that walk both need pinning: no page is empty before the
     * end, pages do not overlap or skip, and the last one says so.
     */
    @Test
    void pagingCoversEveryMatchExactlyOnce() {
        seedDealsForSearch();

        Page<Promotion> first = searchPage(null, null, null, 0, 1);
        Page<Promotion> second = searchPage(null, null, null, 1, 1);

        assertEquals(2, first.getTotalElements(),
                "both seeded deals are active, so both are searchable");
        assertEquals(1, first.getContent().size(), "one row was asked for");
        assertEquals(1, second.getContent().size(), "and the next page has the other");
        assertFalse(first.isLast(), "there is a second page, so the first is not the last");
        assertTrue(second.isLast(), "the second of two pages is where load-more must stop");

        assertEquals(
                promotionRepository.findAllActive().stream().map(Promotion::getPromotionID).toList()
                        .stream().sorted().toList(),
                Stream.concat(first.getContent().stream(), second.getContent().stream())
                        .map(Promotion::getPromotionID).sorted().toList(),
                "paging must partition the result: the same rows, none repeated, none lost");
    }

    /**
     * The count behind {@code last} has to respect the filters, or the button offers a
     * page that turns out to be empty.
     */
    @Test
    void theTotalCountsOnlyMatchingDeals() {
        seedDealsForSearch();

        assertEquals(1, searchPage("%coffee%", null, null, 0, 10).getTotalElements(),
                "the count must apply the keyword, not count the whole active feed");
        assertEquals(1, searchPage(null, 100.0, null, 0, 10).getTotalElements(),
                "the count must apply the budget filter too");
        assertEquals(2, searchPage(null, null, null, 0, 10).getTotalElements(),
                "with no filters it counts every active deal");
    }

    private List<Promotion> feedPage(int size) {
        return promotionRepository.findByIsActiveTrue(PageRequest.ofSize(size));
    }

    private Page<Promotion> searchPage(String term, Double maxPrice, StoreCategory category,
                                       int page, int size) {
        return promotionRepository.searchActive(term, maxPrice, category, PageRequest.of(page, size));
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

    /**
     * The feed order — promoted, then featured, then newest — used to be a Java
     * comparator run over every deal after it had been fetched. It is now the query's
     * ORDER BY, which is the whole reason the feed can be served by an ordered index
     * walk, so the order it produces is worth pinning down.
     *
     * <p>The promoted and featured columns are nullable and the seeded rows leave them
     * null, which is the case the {@code coalesce} in the query exists for: an untagged
     * deal must sort below a tagged one, not above it as a bare DESC would.
     */
    @Test
    void theFeedOrdersPromotedThenFeaturedThenNewest() {
        seedDealsForOrdering();

        assertEquals(List.of("Promoted", "Featured", "Newest Untagged", "Deal 2", "Deal 1"),
                titlesOf(feedPage(50)),
                "promoted first, then featured, then newest — and an untagged deal is "
                        + "ordered by date among the untagged, not pushed to the front by "
                        + "a null promoted/featured sorting ahead of every real value");
    }

    /**
     * Search used to load every active deal and drop the non-matching ones in a Java
     * stream, so it now has to be asserted against the database. The patterns below are
     * already wrapped in {@code %} because that wrapping is the service's job, and this
     * is a repository test — services are not wired in {@code @DataJpaTest}.
     */
    @Test
    void searchFiltersInTheDatabaseRatherThanInJava() {
        seedDealsForSearch();

        assertEquals(List.of("Cheap Coffee"), titlesOf(search("%coffee%", null, null)),
                "a keyword must match the title");

        assertEquals(List.of("Cheap Coffee"), titlesOf(search("%bundle%", null, null)),
                "a keyword must also match the description");

        // "Cheap Coffee" is deal-1, on the store renamed "Fancy Roaster"; neither its
        // title nor its description contains "roaster". It comes back only because the
        // store name is searched, which the old Java filter did.
        assertEquals(List.of("Cheap Coffee", "Fancy Roaster Beans"),
                titlesOf(search("%roaster%", null, null)),
                "a keyword must match the store name as well as the title");

        assertEquals(List.of("Cheap Coffee"), titlesOf(search(null, 100.0, null)),
                "a budget must exclude anything dearer than it");

        assertEquals(List.of("Cheap Coffee"), titlesOf(search(null, null, StoreCategory.RESTAURANT)),
                "a category must select only that category");

        assertEquals(List.of("Fancy Roaster Beans"),
                titlesOf(search(null, null, StoreCategory.GROCERY)),
                "and it must be the category asked for, not a fixed one");

        assertEquals(List.of("Cheap Coffee"),
                titlesOf(search("%roaster%", 100.0, StoreCategory.RESTAURANT)),
                "filters must combine, not replace one another");

        assertEquals(2, search(null, null, null).size(),
                "omitting every filter must return the whole active feed, not nothing");

        // A deal that has been switched off must not come back, which is also what stops
        // an inactive deal being visible through search.
        jdbc.update("update promotions set is_active = false where title = ?", "Fancy Roaster Beans");
        entityManager.clear();
        assertEquals(List.of("Cheap Coffee"), titlesOf(search(null, null, null)),
                "only active deals are searchable");
    }

    /**
     * The patterns reaching this query are wrapped in {@code %} and any {@code ~} in the
     * term doubled, so a shopper searching for "%" gets a literal match rather than the
     * wildcard the LIKE would otherwise read it as. Only "Cheap Coffee" has a percent
     * sign anywhere in it, so it is the only deal that can legitimately come back.
     */
    @Test
    void aWildcardCharacterInTheSearchTermIsMatchedLiterally() {
        seedDealsForSearch();

        assertEquals(2, search("%%%", null, null).size(),
                "an unescaped term really would match everything, which is what the "
                        + "service's doubling of ~ is there to prevent");

        assertEquals(List.of("Cheap Coffee"), titlesOf(search("%~%%", null, null)),
                "an escaped term matches only the text that really contains a %");
    }

    @Test
    void theSchedulerReadsOnlyOptedInDealsAndNoEntities() {
        seedDealsForScheduling();
        entityManager.clear();

        Statistics statistics = statistics();
        statistics.clear();

        List<Object[]> schedule = promotionRepository.findScheduleState();

        assertEquals(List.of("scheduled-expired", "scheduled-open"),
                schedule.stream().map(row -> (String) row[0]).sorted().toList(),
                "the opted-in deals come back, and nothing else");

        assertEquals(0, statistics.getEntityLoadCount(),
                "this must be a scalar projection: managed entities here would be "
                        + "dirty-checked every minute, which is what the old findAll() did");
    }

    private List<Promotion> search(String term, Double maxPrice, StoreCategory category) {
        // One page far larger than anything these tests seed, so the assertions stay
        // about which deals match rather than about paging. Paging has its own tests.
        return promotionRepository.searchActive(term, maxPrice, category,
                PageRequest.of(0, 100)).getContent();
    }

    private List<String> titlesOf(List<Promotion> promotions) {
        return promotions.stream().map(Promotion::getTitle).toList();
    }

    private void seedDealsForOrdering() {
        // Two owners and stores, so the deal feed still exercises the store + owner
        // join rather than being served two rows from one cached store.
        seedTwoDealsWithDistinctStoresAndOwners();
        jdbc.update("update promotions set created_at = ?, featured = ?, promoted = ? where promotionid = ?",
                Timestamp.valueOf("2024-01-01 10:00:00"), false, false, "deal-1");
        jdbc.update("update promotions set created_at = ?, featured = ?, promoted = ? where promotionid = ?",
                Timestamp.valueOf("2024-01-02 10:00:00"), false, false, "deal-2");

        // Untagged is the NEWEST of the untagged three, so it only leads that group if
        // the null promoted/featured is read as false rather than sorting to the front.
        insertDeal("Promoted", "store-1", "2024-01-03 10:00:00", true, true);
        insertDeal("Featured", "store-2", "2024-01-04 10:00:00", true, false);
        insertDeal("Newest Untagged", "store-1", "2024-01-05 10:00:00", null, null);
    }

    private void insertDeal(String title, String storeId, String createdAt, Boolean featured, Boolean promoted) {
        jdbc.update("""
                insert into promotions (promotionid, title, store_id, is_active, created_at, featured, promoted)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                "deal-" + title.toLowerCase(), title, storeId, Boolean.TRUE,
                Timestamp.valueOf(createdAt), featured, promoted);
    }

    /**
     * Filler deals for the limit test, so the feed holds comfortably more rows than the
     * page being asked for. Untagged and all on one store, because nothing here is about
     * ordering or ownership — it is about how many rows the database produces.
     */
    private void seedExtraDeals(int count) {
        for (int i = 1; i <= count; i++) {
            insertDeal("Extra" + i, "store-1", String.format("2024-02-%02d 10:00:00", i), false, false);
        }
    }

    private void seedDealsForSearch() {
        seedTwoDealsWithDistinctStoresAndOwners();
        jdbc.update("update stores set store_name = ? where store_id = ?", "Fancy Roaster", "store-1");
        // deal-1 sits in a RESTAURANT, deal-2 in a GROCERY, so a category filter has to
        // actually separate them. Both being RESTAURANT would pass while the filter did
        // nothing at all.
        jdbc.update("update stores set category = ? where store_id = ?", "GROCERY", "store-2");
        jdbc.update("update promotions set title = ?, description = ?, discount_price = ? where promotionid = ?",
                "Cheap Coffee", "A 50% off bundle", 50.0, "deal-1");
        jdbc.update("update promotions set title = ?, description = ?, discount_price = ? where promotionid = ?",
                "Fancy Roaster Beans", "Single origin", 500.0, "deal-2");
    }

    private void seedDealsForScheduling() {
        seedTwoDealsWithDistinctStoresAndOwners();
        // Both are opted in, so the query must return two rows and no entity.
        jdbc.update("update promotions set schedule_enabled = true, start_date = ?, end_date = ? where promotionid = ?",
                Timestamp.valueOf("2024-01-01 00:00:00"), Timestamp.valueOf("2024-02-01 00:00:00"), "deal-1");
        jdbc.update("update promotions set schedule_enabled = true, start_date = ?, end_date = ? where promotionid = ?",
                Timestamp.valueOf("2024-01-01 00:00:00"), Timestamp.valueOf("2024-02-01 00:00:00"), "deal-2");
        jdbc.update("update promotions set promotionid = 'scheduled-open' where promotionid = 'deal-1'");
        jdbc.update("update promotions set promotionid = 'scheduled-expired' where promotionid = 'deal-2'");
    }
}
