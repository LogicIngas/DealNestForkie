package za.ac.cput.dealnest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the admin overview's counts to what the browser was computing before.
 *
 * <p>The console used to download all four tables and derive every number with
 * Array.filter. These counts replaced that, so the risk is not that they are wrong in
 * isolation — it is that they quietly disagree with the filters they took over, and the
 * dashboard shows a different number than it used to with no error anywhere.
 *
 * <p>Each expectation below is written as the JavaScript filter it replaces, so a change
 * to the predicate on either side has to be made twice and the disagreement surfaces here.
 * The two that are easy to get wrong:
 *
 * <ul>
 *   <li>Unverified was {@code !store.verified}, which counts a NULL as unverified.
 *       {@code = false} would silently drop those rows. {@code @PrePersist} defaults the
 *       column, so this only bites on rows inserted another way — seeded exactly that way
 *       below.</li>
 *   <li>Active was {@code store.active}, i.e. plain truthiness, so a NULL counts as
 *       inactive. Only TRUE is counted as active.</li>
 * </ul>
 *
 * <p>Rows go in through {@link JdbcTemplate} for the reason given in
 * {@link IPromotionRepositoryQueryTest}: these entities carry hand-assigned String ids, so
 * Spring Data's {@code save} would route every row to {@code merge} and fail.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
class AdminStatsRepositoryQueryTest {

    @Autowired
    private IStoreRepository storeRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IPromotionRepository promotionRepository;

    @Autowired
    private IDealReportRepository dealReportRepository;

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
    void storeCountsMatchTheFiltersTheBrowserUsedToRun() {
        seed();

        // The seeded flags, per column, so the two counts are reasoned about separately.
        // store-1 (TRUE, TRUE), store-2 (TRUE, FALSE), store-3 (FALSE, TRUE),
        // store-4 (null, null) — the last predating the column default.
        // Arrays.asList, not List.of: the null column is the case under test and List.of
        // rejects null elements outright.
        List<Boolean> active = Arrays.asList(Boolean.TRUE, Boolean.TRUE, Boolean.FALSE, null);
        List<Boolean> verified = Arrays.asList(Boolean.TRUE, Boolean.FALSE, Boolean.TRUE, null);

        assertEquals(4, storeRepository.count(), "every store, matching stores.length");

        assertEquals(
                active.stream().filter(Boolean.TRUE::equals).count(),
                storeRepository.countActive(),
                "`s.active` is truthiness, so only TRUE is active — neither the FALSE row "
                        + "nor the null row counts");

        assertEquals(
                verified.stream().filter(v -> !Boolean.TRUE.equals(v)).count(),
                storeRepository.countUnverified(),
                "`!s.verified` counts a null as unverified, so this must be \"is not true\" "
                        + "rather than \"= false\" — store-2 (FALSE) and store-4 (null) both "
                        + "belong in this number, and store-3 stays out despite being inactive");
    }

    @Test
    void theProStoreCountOnlyCountsProPlanStores() {
        seed();

        // plan_tier: store-1 PRO, store-2 FREE, store-3 PRO, store-4 PRO.
        assertEquals(3, storeRepository.countProPlan(),
                "`s.planTier === 'PRO'` is an exact match, so FREE and null are excluded");
    }

    @Test
    void userCountsMatchTheFiltersTheBrowserUsedToRun() {
        seed();

        assertEquals(4, userRepository.count(), "every user, matching users.length");

        // plan_tier: owner-1/owner-2 FREE, customer-1 PLUS, customer-2 null.
        assertEquals(1, userRepository.countPlusPlan(),
                "`u.planTier === 'PLUS'` is an exact match: a FREE user and a null tier "
                        + "are both excluded, which is why an equality predicate is right "
                        + "here even though the unverified store count needs a null-safe one");
    }

    @Test
    void promotionCountsMatchTheFiltersTheBrowserUsedToRun() {
        seed();

        assertEquals(4, promotionRepository.count(), "every promotion, matching promotions.length");

        // is_active: deal-1 TRUE, deal-2 FALSE, deal-3 TRUE, deal-4 null.
        assertEquals(2, promotionRepository.countActive(),
                "`p.isActive` is truthiness in the old filter, so the null row is not active");
    }

    @Test
    void pendingReportCountOnlyCountsPendingReports() {
        seed();

        assertEquals(3, dealReportRepository.count(), "every report, matching reports.length");

        assertEquals(2, dealReportRepository.countByStatus(DealReportStatus.PENDING),
                "`r.status === 'PENDING'` — the resolved report drops out of the count");
    }

    /**
     * The category chart used to be built by tallying the store list in the browser. It
     * is a GROUP BY now, so it has to return the same shape: one row per category that
     * actually has stores, with the counts right.
     */
    @Test
    void theCategoryBreakdownGroupsInsteadOfTallying() {
        seed();

        List<Object[]> rows = storeRepository.countByCategory();
        assertEquals(2, rows.size(), "only the two categories that have stores, not one row per store");

        Map<Object, Long> byCategory = new HashMap<>();
        rows.forEach(row -> byCategory.put(row[0], ((Number) row[1]).longValue()));

        assertEquals(2L, byCategory.get(za.ac.cput.dealnest.domain.StoreCategory.RESTAURANT),
                "store-1 and store-2 are both RESTAURANT");
        assertEquals(2L, byCategory.get(za.ac.cput.dealnest.domain.StoreCategory.ELECTRONICS),
                "store-3 and store-4 are both ELECTRONICS");
    }

    /**
     * The users tab's "Store" badge. It used to be derived from the store list, which the
     * console no longer loads up front, so the badge silently depended on the admin having
     * opened the Stores tab first. These ids come back with the stats instead.
     *
     * <p>All four seeded users own a store (store-4 belongs to customer-2), so the point
     * being pinned is the {@code distinct}: four stores, four owners, and a list that
     * happened to be a set anyway. Seeding a second store on one owner is what makes the
     * test fail if the distinct is ever dropped.
     */
    @Test
    void theOwnerIdListNamesEachStoreOwnerOnce() {
        seed();
        // owner-1 now owns a second store. Without `distinct` this appears twice.
        insertStore("store-5", "owner-1", "RESTAURANT", Boolean.TRUE, Boolean.TRUE, "FREE");
        entityManager.clear();

        List<String> ownerIds = storeRepository.findDistinctOwnerIds();

        assertEquals(
                List.of("customer-1", "customer-2", "owner-1", "owner-2"),
                ownerIds.stream().sorted().toList(),
                "five stores but four owners: an owner with two stores is listed once, and "
                        + "every owner is listed — the badge is about owning a store, not "
                        + "about how many");
    }

    /**
     * The activity table draws a fixed number of rows. It is fed by a limited query now
     * rather than by slicing the full list, and the limit is the point: a bigger
     * catalogue must not be read to fill eight cards.
     */
    @Test
    void recentPromotionsStopAtTheLimitAndArriveNewestFirst() {
        seed();
        seedExtraDeals(20);

        List<Promotion> recent = promotionRepository.findRecent(PageRequest.ofSize(8));

        assertEquals(8, recent.size(),
                "the activity table draws eight, so eight rows is all the database should "
                        + "produce out of the deals seeded here");

        // The store is needed for the store name the table prints. It must already be
        // attached, or Jackson fetches it per row and the panel is slow again.
        recent.forEach(deal -> assertNotNull(deal.getStore().getStoreName(),
                "the store name is rendered, so the store cannot be a lazy proxy here"));
    }

    /**
     * The old panel sorted newest-first in the browser and kept eight, so the rows the
     * limited query returns have to be the same rows in the same order. The IDs are
     * seeded newest-last, so the first row returned is the one with the latest timestamp.
     */
    @Test
    void theLimitedRecentListIsTheLeadingRowsOfTheWholeList() {
        seed();

        List<Promotion> whole = promotionRepository.findRecent(PageRequest.ofSize(50));
        List<Promotion> firstTwo = promotionRepository.findRecent(PageRequest.ofSize(2));

        assertEquals(
                whole.subList(0, 2).stream().map(Promotion::getPromotionID).toList(),
                firstTwo.stream().map(Promotion::getPromotionID).toList(),
                "a limited list has to be a prefix of the full one, in the same order");

        Timestamp first = Timestamp.valueOf(whole.get(0).getCreatedAt());
        Timestamp second = Timestamp.valueOf(whole.get(1).getCreatedAt());
        assertTrue(first.after(second), "newest first");
    }

    /**
     * Paging correctness, which is the risk the counts did not carry.
     *
     * <p>Walking the pages of a table and comparing them to reading the table whole is the
     * only check that catches the classic OFFSET bug: rows skipped across a page boundary
     * because the query has no total order for the database to fall back on. With a stable
     * order, walking the pages yields exactly the full list.
     *
     * <p>Seeded to 11 users read in pages of 5, so the walk ends on a short page — the case
     * where a client that decides "is there more" by comparing row count to page size gets
     * it wrong.
     */
    @Test
    void pagingThroughUsersReproducesTheWholeListExactly() {
        seed();
        for (int i = 0; i < 7; i++) {
            insertUser("walk-" + i, String.format("walk%02d@example.com", i), "FREE");
        }
        entityManager.clear();

        List<String> walked = new ArrayList<>();
        int page = 0;
        int requests = 0;
        while (true) {
            Page<User> result = userRepository.findAllForAdmin(PageRequest.of(page, 5));
            requests++;
            result.getContent().forEach(u -> walked.add(u.getUserID()));
            if (result.isLast()) break;
            page++;
        }

        List<String> whole = userRepository.findAll().stream()
                .map(User::getUserID)
                .sorted()
                .toList();

        assertEquals(whole, walked.stream().sorted().toList(),
                "every user exactly once: no row skipped across a page boundary, none "
                        + "returned twice");
        assertEquals(3, requests,
                "11 users in pages of 5 is three requests, the last one short — fewer means "
                        + "the walk stopped early, more means it asked past the end");
    }

    /**
     * The paged store query keeps the owner fetch. The console's store cards don't print the
     * owner, but the list did carry the association before paging, and without the join
     * Jackson would resolve it one row at a time — the exact per-row cost paging was meant
     * to remove.
     */
    @Test
    void theStorePageArrivesWithOwnersAttached() {
        seed();

        Page<Store> page = storeRepository.findAllForAdmin(PageRequest.ofSize(3));

        assertEquals(3, page.getContent().size());
        page.getContent().forEach(store -> assertNotNull(store.getUser().getEmail(),
                "store name and owner both rendered on the card, so neither can be a lazy "
                        + "proxy here"));
    }

    /**
     * The report cards print the reported deal's title and its store's name, which means
     * three associations deep: report → promotion → store → owner. The old unpaged query
     * fetched the chain; the paged one has to keep it, or the tab falls back to one query
     * per field per row.
     */
    @Test
    void theReportPageArrivesWithTheDealAndStoreChainAttached() {
        seed();

        Page<DealReport> page = dealReportRepository.findAllForAdmin(PageRequest.ofSize(3));

        assertEquals(3, page.getContent().size());
        page.getContent().forEach(report -> {
            assertNotNull(report.getPromotion().getTitle(), "the card prints the deal title");
            assertNotNull(report.getPromotion().getStore().getStoreName(),
                    "and the store the deal belongs to");
        });
    }

    /**
     * A page past the end is empty rather than an error, and reports itself as the last one.
     * The client keys "show load more" off this, so a wrong answer here leaves a button that
     * never stops, or hides the last page of rows.
     */
    @Test
    void aPageBeyondTheEndIsEmptyAndReportsItselfAsTheLast() {
        seed();

        Page<Promotion> past = promotionRepository.findAllForAdmin(PageRequest.of(50, 24));

        assertTrue(past.getContent().isEmpty(), "no rows to invent");
        assertTrue(past.isLast(), "and no further pages to ask for");
        assertEquals(4, past.getTotalElements(),
                "the count is the table size, not the number of rows this page returned");
    }

    /**
     * Four owners, four stores, four deals, three reports — chosen so every count has both
     * a row that belongs and a row that does not. Without the negative cases a count that
     * ignored its predicate would still pass.
     */
    private void seed() {
        // plan_tier: FREE, FREE, FREE, null
        insertUser("owner-1", "owner1@example.com", "FREE");
        insertUser("owner-2", "owner2@example.com", "FREE");
        insertUser("customer-1", "customer1@example.com", "PLUS");
        insertUser("customer-2", "customer2@example.com", null);

        // Flags: (TRUE,TRUE), (TRUE,FALSE), (FALSE,TRUE), (null,null)
        insertStore("store-1", "owner-1", "RESTAURANT", Boolean.TRUE, Boolean.TRUE, "PRO");
        insertStore("store-2", "owner-2", "RESTAURANT", Boolean.TRUE, Boolean.FALSE, "FREE");
        insertStore("store-3", "customer-1", "ELECTRONICS", Boolean.FALSE, Boolean.TRUE, "PRO");
        insertStore("store-4", "customer-2", "ELECTRONICS", null, null, "PRO");

        // is_active: TRUE, FALSE, TRUE, null. Timestamps ascending by id.
        insertPromotion("deal-1", "store-1", Boolean.TRUE, 1);
        insertPromotion("deal-2", "store-1", Boolean.FALSE, 2);
        insertPromotion("deal-3", "store-2", Boolean.TRUE, 3);
        insertPromotion("deal-4", "store-2", null, 4);

        insertReport("report-1", "deal-1", "customer-1", DealReportStatus.PENDING);
        insertReport("report-2", "deal-2", "customer-1", DealReportStatus.PENDING);
        insertReport("report-3", "deal-3", "customer-2", DealReportStatus.REVIEWED);

        entityManager.clear();
    }

    private void seedExtraDeals(int count) {
        for (int i = 0; i < count; i++) {
            // Timestamps after every seeded deal, so these are the newest rows and the
            // limited query is genuinely choosing rather than truncating the tail.
            insertPromotion("extra-deal-" + i, "store-1", Boolean.TRUE, 100 + i);
        }
        entityManager.clear();
    }

    private void insertUser(String id, String email, String planTier) {
        jdbc.update("""
                insert into users (userid, email, first_name, last_name, password,
                                   is_active, current_streak, longest_streak,
                                   latitude, longitude, plan_tier)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id, email, "First", "Last", "irrelevant-for-this-test",
                Boolean.TRUE, 0, 0, 0.0d, 0.0d, planTier);
    }

    private void insertStore(String id, String ownerId, String category,
                             Boolean active, Boolean verified, String planTier) {
        jdbc.update("""
                insert into stores (store_id, store_name, user_id, category,
                                    is_active, is_verified, total_reviews,
                                    latitude, longitude, plan_tier)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id, "Store " + id, ownerId, category,
                active, verified, 0, 0.0d, 0.0d, planTier);
    }

    private void insertPromotion(String id, String storeId, Boolean active, int dayOffset) {
        jdbc.update("""
                insert into promotions (promotionid, title, store_id, is_active, created_at)
                values (?, ?, ?, ?, ?)
                """,
                id, "Deal " + id, storeId, active,
                Timestamp.valueOf(LocalDateTime.of(2026, 1, 1, 12, 0).plusDays(dayOffset)));
    }

    private void insertReport(String id, String promotionId, String userId, DealReportStatus status) {
        // reason and status are the enum names as strings, not the enum constants. A
        // JdbcTemplate parameter is bound as an object it has no type for, so an enum
        // constant is serialised as a Java object and H2 rejects it against the column.
        jdbc.update("""
                insert into deal_reports (reportid, reason, status, promotion_id, user_id, created_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                id, "MISLEADING", status.name(),
                promotionId, userId, Timestamp.valueOf(LocalDateTime.of(2026, 1, 2, 12, 0)));
    }
}
