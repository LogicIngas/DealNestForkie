package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.StoreCategory;

import java.util.List;
import java.util.Optional;

public interface IPromotionRepository extends JpaRepository<Promotion, String> {

    /**
     * The feed's ordering: promoted first, then featured, then newest.
     *
     * <p>This was a Java comparator that ran after every deal had already been fetched
     * and materialised. Sorting it here instead means Postgres uses
     * idx_promotions_active_feed (built in this same column order) to walk the index
     * already sorted, and the response leaves the database ready to serialise.
     *
     * <p>{@code coalesce} is what keeps it identical to the comparator it replaced. Those
     * three columns are nullable, and a null sorts ahead of every real value in
     * Postgres, which would put untagged deals at the top of the feed. Treating null as
     * false reproduces the old "only TRUE counts" rule. {@code nulls last} does the same
     * for deals that predate the created_at column.
     *
     * <p>Declared as a constant rather than a method because @Query takes a compile-time
     * constant, which a method call is not.
     */
    String FEED_ORDER = " order by coalesce(p.promoted, false) desc,"
            + " coalesce(p.featured, false) desc,"
            + " p.createdAt desc nulls last";

    /**
     * These list queries fetch the store and its owner in the same statement.
     *
     * <p>Promotion lists are returned as entities and serialised straight to JSON, so
     * Jackson walks promotion.store.storeOwner while writing the response. With both
     * associations lazy that is one extra query per row, which is what turned a
     * 40-deal feed into a few hundred round trips to Postgres.
     *
     * <p>Both associations are to-one, so the join cannot duplicate rows and needs no
     * distinct. Fetching the owner as well keeps the response shape unchanged for
     * callers that read it (the admin dashboard resolves store ownership from it).
     */
    @Query("select p from Promotion p join fetch p.store s join fetch s.user where p.isActive = true"
            + FEED_ORDER)
    List<Promotion> findByIsActiveTrue();

    @Query("select p from Promotion p join fetch p.store s join fetch s.user where s.storeId = :storeId"
            + FEED_ORDER)
    List<Promotion> findByStore_StoreId(String storeId);

    @Query("select p from Promotion p join fetch p.store s join fetch s.user"
            + FEED_ORDER)
    List<Promotion> findAllWithStore();

    /**
     * Search for shoppers, filtering in the database.
     *
     * <p>This used to load every active deal and then drop the non-matching ones in a
     * Java stream, so a search cost the same as the whole feed no matter how narrow the
     * query was, and the sort was paid a second time on top. The keyword/budget/category
     * tests are all cheap for Postgres to apply and are now part of the statement, so
     * only matching rows are fetched and materialised.
     *
     * <p>Each filter is written as "{@code :param is null} or ..." so an omitted filter
     * stays in the query as a no-op instead of needing a different query per combination
     * of the three.
     *
     * <p>{@code escape '~'} keeps the old partial-match behaviour for a normal search
     * term while stopping a term that itself contains {@code %} or {@code _} from being
     * read as a wildcard. The service wraps the caller's term in {@code %} and doubles
     * any {@code ~} it contains, per LIKE's escaping rules.
     */
    @Query("select p from Promotion p join fetch p.store s join fetch s.user "
            + "where p.isActive = true "
            + "and (:keyword is null "
            + "     or lower(p.title) like :keyword escape '~' "
            + "     or lower(p.description) like :keyword escape '~' "
            + "     or lower(s.storeName) like :keyword escape '~') "
            + "and (:maxPrice is null or p.discountPrice <= :maxPrice) "
            + "and (:category is null or s.category = :category) "
            + FEED_ORDER)
    List<Promotion> searchActive(@Param("keyword") String keyword,
                                 @Param("maxPrice") Double maxPrice,
                                 @Param("category") StoreCategory category);

    /**
     * The single promotion behind {@code /read/{id}}, with the store and owner attached.
     *
     * <p>{@code findById} cannot be used for this because the response body includes
     * {@code promotion.store.storeOwner}, and those are lazy. With open-in-view off there
     * is no session left by the time Jackson reads them, so the fetch has to happen in
     * the statement that loads the promotion.
     */
    @Query("select p from Promotion p join fetch p.store s join fetch s.user where p.promotionID = :promotionID")
    Optional<Promotion> findDetailedById(@Param("promotionID") String promotionID);

    /**
     * Just the scheduling columns of every deal that opted into automatic activation.
     *
     * <p>The scheduler used to call {@code findAll()}: the entire promotions table
     * loaded as managed entities, held in the session, and dirty-checked, on a fixed
     * 60-second timer. It then compared each row against {@code now} in Java. That is a
     * full scan of the table plus a connection from a pool of five, every minute, to do
     * work that almost always concludes in "nothing changed".
     *
     * <p>This returns four scalars for the rows that opted in — served straight from
     * idx_promotions_schedule — and no managed entities, so the session has nothing to
     * dirty-check. The rows that actually need flipping are re-read by id and saved, so
     * a normal tick writes nothing at all.
     *
     * <p>Selected as {@code isActive}, matching the field name. The getter is
     * {@code getActive()} and the JSON property is {@code isActive}, but JPQL resolves
     * against the field.
     */
    @Query("select p.promotionID, p.startDate, p.endDate, p.isActive "
            + "from Promotion p where p.scheduleEnabled = true")
    List<Object[]> findScheduleState();
}
