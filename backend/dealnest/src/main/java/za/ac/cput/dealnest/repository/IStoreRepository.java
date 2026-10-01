package za.ac.cput.dealnest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;

import java.util.List;
import java.util.Optional;

public interface IStoreRepository extends JpaRepository<Store,String> {
    Optional<Store> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Store> findByCategory(StoreCategory category);

    List<Store> findByCity(String city);

    /**
     * Store lists are serialised to JSON with the owner attached, and the owner is a
     * lazy to-one, so leaving it unfetched costs one extra query per store. It is
     * fetched here instead. To-one, so the join cannot duplicate rows.
     */
    @Query("select s from Store s join fetch s.user where s.isActive = true")
    List<Store> findByIsActiveTrue();

    List<Store> findByStoreNameContainingIgnoreCase(String storeName);

    Optional<Store> findByUser_UserID(String userID);

    /** Owner pre-fetched, for the list endpoints that return every store. */
    @Query("select s from Store s join fetch s.user")
    List<Store> findAllWithOwner();

    /**
     * The leading active stores, stopped at {@code pageable}'s rows.
     *
     * <p>The home page draws a fixed number of cards and used to call
     * {@link #findAllWithOwner()} for them — the entire store table, every owner
     * attached, unfiltered by the active flag the page filters on anyway — and then kept
     * the first few rows. That made the page scale with the size of the store directory
     * rather than with what it shows. This stops at the limit instead.
     *
     * <p>Ordered by rating, descending, so the leading rows are the ones a
     * rating-first card list wants and the cap cannot change which stores appear at the
     * top. {@code storeId} is the tiebreaker: many stores share a rating (and a brand-new
     * one shares a null), and without a total order Postgres may return tied rows in a
     * different order between calls, so a capped query could otherwise show a different
     * set of stores on two visits.
     *
     * <p>Null ratings sort last, matching the browser's previous behaviour of comparing
     * {@code averageRating} and skipping the nulls.
     */
    @Query("select s from Store s join fetch s.user where s.isActive = true"
            + " order by s.averageRating desc nulls last, s.storeId asc")
    List<Store> findActive(Pageable pageable);

    /**
     * A single store with its owner attached.
     *
     * <p>{@code findById} cannot serve the read endpoints: a Store is serialised with
     * its {@code user} field, and that is a lazy to-one. With open-in-view off there is
     * no session left when Jackson reaches it, so the owner has to come back with the
     * store. It is also the ownership check on most write paths, which is the same
     * association.
     */
    @Query("select s from Store s join fetch s.user where s.storeId = :storeId")
    Optional<Store> findDetailedById(@Param("storeId") String storeId);

    /** The store a user owns, owner attached, for the "my store" endpoints. */
    @Query("select s from Store s join fetch s.user where s.user.userID = :userID")
    Optional<Store> findDetailedByUserId(@Param("userID") String userID);

    // -----------------------------------------------------------------------
    // Counts for the admin overview. See IAdminService.getStats() for why these
    // exist: the console used to load every store and count the rows in the
    // browser, so the overview cost the whole table to draw one number.
    //
    // The verified/active predicates are written as "is not true" rather than
    // "= false" to match the JavaScript they replace. Both columns are a
    // nullable Boolean, and the old filter was `!s.verified`, which counts a
    // null as unverified — "= false" would silently exclude those rows. @PrePersist
    // defaults them, so this is a legacy-data guard rather than an expected case.
    // -----------------------------------------------------------------------

    long count();

    @Query("select count(s) from Store s where s.isActive = true")
    long countActive();

    @Query("select count(s) from Store s where coalesce(s.isVerified, false) = false")
    long countUnverified();

    @Query("select count(s) from Store s where s.planTier = za.ac.cput.dealnest.domain.StorePlanTier.PRO")
    long countProPlan();

    /**
     * Store count per category, for the overview's chart.
     *
     * <p>A GROUP BY returns one row per category rather than one per store. Counted
     * in the browser the chart needed the full store list first.
     */
    @Query("select s.category, count(s) from Store s group by s.category")
    List<Object[]> countByCategory();

    /**
     * The user IDs that own at least one store, each once.
     *
     * <p>For the users tab's "Store" badge. It used to be derived by mapping over the whole
     * store list, which the console no longer loads up front, so the badge depended on the
     * admin having opened the stores tab first. A distinct projection of one indexed
     * column, served by idx_stores_owner, makes it independent of that.
     *
     * <p>Stores with no owner are excluded rather than contributing a null: there is no id
     * to match a user against, and a null in this list would match nothing anyway.
     */
    @Query("select distinct s.user.userID from Store s where s.user is not null")
    List<String> findDistinctOwnerIds();

    /**
     * One page of the admin console's store list, owner attached.
     *
     * <p>Same rows and same owner join as {@link #findAllWithOwner()}, stopped at the
     * page size instead of returning the table. The order is by name so paging is
     * repeatable: without a total order, OFFSET can show a store on two pages and skip
     * another, since Postgres is free to return tied rows in any order between
     * statements. {@code storeId} is the tiebreaker for names that repeat, which is
     * common enough across cities not to be hypothetical.
     *
     * <p>The count is declared rather than derived. Spring Data would otherwise build it
     * by editing the select clause of a query that join-fetches the owner, carrying that
     * join into a statement that only has to count rows.
     */
    @Query(value = "select s from Store s join fetch s.user order by s.storeName asc, s.storeId asc",
            countQuery = "select count(s) from Store s")
    Page<Store> findAllForAdmin(Pageable pageable);
}
