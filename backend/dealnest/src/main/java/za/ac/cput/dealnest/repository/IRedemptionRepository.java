package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Redemption;

import java.util.List;
import java.util.Optional;

public interface IRedemptionRepository extends JpaRepository<Redemption, String> {
    Optional<Redemption> findByCode(String code);
    List<Redemption> findByUser_UserID(String userId);
    boolean existsByCode(String code);

    // Explicit JPQL rather than a derived name: the primary key is redemptionID, so
    // findDetailedById would be parsed as a lookup on a non-existent "id" property and
    // fail the whole context at startup. join fetch pulls the voucher details the email
    // needs in one round trip. Every join is to-one, so this cannot duplicate rows.
    @Query("select r from Redemption r "
            + "join fetch r.user "
            + "join fetch r.promotion p "
            + "join fetch p.store "
            + "where r.redemptionID = :redemptionID")
    Optional<Redemption> findDetailedById(@Param("redemptionID") String redemptionID);
}
