package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Review;
import java.util.List;
import java.util.Optional;

public interface IReviewRepository extends JpaRepository<Review, String> {

    /**
     * Both sides of a review come back attached.
     *
     * <p>A Review is serialised with {@code store} and {@code user}, both lazy to-ones,
     * and a Store is itself serialised with its owner. Leaving them unfetched meant one
     * query per review for the author, one for the store, and one more per store for the
     * owner. Every join here is to-one, so no rows are duplicated. Served by
     * idx_reviews_store.
     */
    @Query("select r from Review r join fetch r.store s left join fetch s.user left join fetch r.user "
            + "where s.storeId = :storeId")
    List<Review> findByStore_StoreId(String storeId);

    @Query("select r from Review r join fetch r.store s left join fetch s.user left join fetch r.user "
            + "where r.reviewID = :reviewID")
    Optional<Review> findDetailedById(@Param("reviewID") String reviewID);

    /**
     * How many reviews a store has and their average rating, computed by the database.
     *
     * <p>Recalculating the rating used to read every review of the store into memory and
     * average them in Java. {@code findByStore_StoreId} now also joins each review's
     * author and its store's owner for the read endpoints, so that approach would have
     * dragged two extra rows of columns along for every review just to call
     * {@code getRating()}. Postgres does the counting instead.
     *
     * <p>{@code coalesce(rating, 0)} keeps the old arithmetic: a review with no rating
     * was counted as a zero by the Java average, whereas SQL {@code avg} would skip it
     * and inflate the result.
     *
     * <p>Returned as a {@code List<Object[]>} even though the aggregate is always a
     * single row. A bare {@code Object[]} return is ambiguous for Spring Data — it
     * cannot tell "the row" from "a one-column result whose value is the row" — and
     * Hibernate resolves it the second way, handing back {@code Object[]{ row }}. The
     * caller then read the row array as a count and every review write died on a
     * ClassCastException. Wrapping in a list makes the shape unambiguous. This is the
     * same form {@code IStoreRepository.countByCategory} and
     * {@code IPromotionRepository.findScheduleState} already use.
     */
    @Query("select count(r), coalesce(avg(coalesce(r.rating, 0)), 0) "
            + "from Review r where r.store.storeId = :storeId")
    List<Object[]> summariseForStore(@Param("storeId") String storeId);
}
