package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Redemption;

import java.util.List;
import java.util.Optional;

public interface IRedemptionRepository extends JpaRepository<Redemption, String> {
    Optional<Redemption> findByCode(String code);
    boolean existsByCode(String code);

    /**
     * The whole chain a voucher is serialised with comes back attached: the redeeming
     * user, the promotion, that promotion's store, and the store's owner.
     *
     * <p>The profile page lists a user's vouchers and reads
     * {@code redemption.promotion.discountPrice} out of them, so leaving these lazy cost
     * three queries per voucher. Every join is to-one, so no rows are duplicated.
     * Served by idx_redemptions_user.
     *
     * <p>Explicit JPQL rather than a derived name: the primary key is redemptionID, so
     * findDetailedById would be parsed as a lookup on a non-existent "id" property and
     * fail the whole context at startup.
     */
    @Query("select r from Redemption r "
            + "join fetch r.user "
            + "join fetch r.promotion p "
            + "join fetch p.store s "
            + "join fetch s.user "
            + "where r.redemptionID = :redemptionID")
    Optional<Redemption> findDetailedById(@Param("redemptionID") String redemptionID);

    @Query("select r from Redemption r "
            + "join fetch r.user "
            + "join fetch r.promotion p "
            + "join fetch p.store s "
            + "join fetch s.user "
            + "where r.user.userID = :userId")
    List<Redemption> findByUser_UserID(String userId);
}
