package za.ac.cput.dealnest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.SavedPromotion;

import javax.sql.DataSource;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The pair lookup behind idempotent saves.
 *
 * <p>Hearts and bookmarks are toggles, so the create endpoint is asked for again on every
 * "like" — from a double tap, a retried request, or a second device whose saved list was
 * read before the first one saved. Neither table has a uniqueness constraint on
 * (user, item), so a second insert for a pair that is already there is silently accepted.
 * That is what makes un-liking look broken: the delete removes the row the client was
 * holding, the duplicate is still in the table, and the control reads as still filled on
 * the next load.
 *
 * <p>Both finders return a List rather than a single result for the same reason. A table
 * that already holds a duplicate must not throw out of the finder — it has to come back
 * so the service can de-duplicate instead of failing the save.
 *
 * <p>Rows are inserted with {@link JdbcTemplate} rather than saved through the
 * repositories. These entities use hand-assigned String identifiers, so Spring Data's
 * {@code save} routes every one of them to {@code merge}, which then fails on a table
 * with no matching row. Plain inserts are all this needs: it reads, it never persists.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
class SavedItemPairLookupTest {

    @Autowired
    private IFavoriteStoreRepository favoriteStoreRepository;

    @Autowired
    private ISavedPromotionRepository savedPromotionRepository;

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
    void aStoreFavouriteIsFoundByTheUserAndStorePair() {
        seedTwoOwnersTwoStoresOneDeal();

        jdbc.update("""
                insert into favorite_stores (favorite_storeid, user_id, store_id, added_date)
                values (?, ?, ?, current_timestamp)
                """, "fav-1", "shopper-1", "store-1");
        jdbc.update("""
                insert into favorite_stores (favorite_storeid, user_id, store_id, added_date)
                values (?, ?, ?, current_timestamp)
                """, "fav-2", "shopper-2", "store-1");
        entityManager.clear();

        List<FavoriteStore> found = favoriteStoreRepository.findByUserAndStore("shopper-1", "store-1");

        assertEquals(1, found.size(), "the pair lookup must return this shopper's own row and nobody else's");
        assertEquals("fav-1", found.get(0).getFavoriteStoreID());
        assertEquals("store-1", found.get(0).getStore().getStoreId());
    }

    @Test
    void aRepeatStoreFavouriteComesBackAsEveryDuplicateRatherThanThrowing() {
        seedTwoOwnersTwoStoresOneDeal();

        // Two rows for one pair — what the unguarded insert produced. The finder has to
        // hand them both back so the service can keep one, instead of throwing
        // IncorrectResultSizeDataAccessException and failing the save outright.
        jdbc.update("""
                insert into favorite_stores (favorite_storeid, user_id, store_id, added_date)
                values (?, ?, ?, current_timestamp)
                """, "fav-1", "shopper-1", "store-1");
        jdbc.update("""
                insert into favorite_stores (favorite_storeid, user_id, store_id, added_date)
                values (?, ?, ?, current_timestamp)
                """, "fav-1-duplicate", "shopper-1", "store-1");
        entityManager.clear();

        assertEquals(2, favoriteStoreRepository.findByUserAndStore("shopper-1", "store-1").size(),
                "a table that already holds duplicates must not blow up the finder");
    }

    @Test
    void aStoreNobodyHasSavedReadsBackEmpty() {
        seedTwoOwnersTwoStoresOneDeal();
        entityManager.clear();

        assertTrue(favoriteStoreRepository.findByUserAndStore("shopper-1", "store-2").isEmpty(),
                "an unsaved store has to read as unsaved, or the heart starts filled for everyone");
    }

    @Test
    void aSavedDealIsFoundByTheUserAndPromotionPair() {
        seedTwoOwnersTwoStoresOneDeal();

        jdbc.update("""
                insert into saved_promotions (saved_promotionid, user_id, promotion_id, saved_date)
                values (?, ?, ?, current_timestamp)
                """, "save-1", "shopper-1", "deal-1");
        jdbc.update("""
                insert into saved_promotions (saved_promotionid, user_id, promotion_id, saved_date)
                values (?, ?, ?, current_timestamp)
                """, "save-2", "shopper-2", "deal-1");
        entityManager.clear();

        List<SavedPromotion> found = savedPromotionRepository.findByUserAndPromotion("shopper-1", "deal-1");

        assertEquals(1, found.size(), "the pair lookup must return this shopper's own row and nobody else's");
        assertEquals("save-1", found.get(0).getSavedPromotionID());
        assertEquals("deal-1", found.get(0).getPromotion().getPromotionID());
    }

    @Test
    void aRepeatSavedDealComesBackAsEveryDuplicateRatherThanThrowing() {
        seedTwoOwnersTwoStoresOneDeal();

        jdbc.update("""
                insert into saved_promotions (saved_promotionid, user_id, promotion_id, saved_date)
                values (?, ?, ?, current_timestamp)
                """, "save-1", "shopper-1", "deal-1");
        jdbc.update("""
                insert into saved_promotions (saved_promotionid, user_id, promotion_id, saved_date)
                values (?, ?, ?, current_timestamp)
                """, "save-1-duplicate", "shopper-1", "deal-1");
        entityManager.clear();

        assertEquals(2, savedPromotionRepository.findByUserAndPromotion("shopper-1", "deal-1").size(),
                "a table that already holds duplicates must not blow up the finder");
    }

    @Test
    void aDealNobodyHasSavedReadsBackEmpty() {
        seedTwoOwnersTwoStoresOneDeal();
        entityManager.clear();

        assertTrue(savedPromotionRepository.findByUserAndPromotion("shopper-1", "deal-2").isEmpty(),
                "an unsaved deal has to read as unsaved, or the bookmark starts filled for everyone");
    }

    /**
     * Two shoppers, two stores and two deals. The pair lookups filter on a user AND an
     * item, so every test needs a second user and a second item on both axes — one of
     * each alone would still pass against a query that only filtered on the other.
     */
    private void seedTwoOwnersTwoStoresOneDeal() {
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
                    insert into users (userid, email, first_name, last_name, password,
                                       is_active, current_streak, longest_streak,
                                       latitude, longitude)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    "shopper-" + i,
                    "shopper" + i + "@example.com",
                    "Shopper" + i,
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
    }
}
