package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.SavedPromotion;

import java.util.List;
import java.util.Optional;

public interface ISavedPromotionRepository extends JpaRepository<SavedPromotion, String> {

    /**
     * The whole chain a saved deal is serialised with comes back attached: the saving
     * user, the promotion, that promotion's store, and the store's owner.
     *
     * <p>The favourites page is the reason this matters. It reads
     * {@code savedPromotion.promotion.promotionID} while rendering, so with these
     * associations lazy the page ran one query per saved deal and, for each of those,
     * another for the store and another for the store's owner. Every join is to-one, so
     * the join cannot duplicate rows. Served by idx_saved_promotions_user.
     */
    String SAVED_FETCH = " join fetch sp.user join fetch sp.promotion p join fetch p.store s join fetch s.user";

    @Query("select sp from SavedPromotion sp" + SAVED_FETCH + " where sp.user.userID = :userID")
    List<SavedPromotion> findByUser_UserID(String userID);

    @Query("select sp from SavedPromotion sp" + SAVED_FETCH + " where p.promotionID = :promotionID")
    List<SavedPromotion> findByPromotion_PromotionID(String promotionID);

    @Query("select sp from SavedPromotion sp" + SAVED_FETCH + " where sp.savedPromotionID = :savedPromotionID")
    Optional<SavedPromotion> findDetailedById(@Param("savedPromotionID") String savedPromotionID);

    /**
     * Every row this user has saved for one promotion.
     *
     * <p>saved_promotions has no uniqueness constraint on (user, promotion), so a repeat
     * save would insert a duplicate. That both leaves the bookmark appearing to survive an
     * unsave and counts twice against the free-plan cap, so the service checks this before
     * it counts anything.
     *
     * <p>A List rather than a single result on purpose: a table that already holds
     * duplicates must not throw out of the finder. Served by idx_saved_promotions_user.
     */
    @Query("select sp from SavedPromotion sp" + SAVED_FETCH
            + " where sp.user.userID = :userID and p.promotionID = :promotionID")
    List<SavedPromotion> findByUserAndPromotion(@Param("userID") String userID,
                                                @Param("promotionID") String promotionID);
}
