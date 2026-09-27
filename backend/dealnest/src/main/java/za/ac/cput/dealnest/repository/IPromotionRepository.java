package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import za.ac.cput.dealnest.domain.Promotion;
import java.util.List;

public interface IPromotionRepository extends JpaRepository<Promotion, String> {

    /**
     * These three list queries fetch the store and its owner in the same statement.
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
    @Query("select p from Promotion p join fetch p.store s join fetch s.user where p.isActive = true")
    List<Promotion> findByIsActiveTrue();

    @Query("select p from Promotion p join fetch p.store s join fetch s.user where s.storeId = :storeId")
    List<Promotion> findByStore_StoreId(String storeId);

    @Query("select p from Promotion p join fetch p.store s join fetch s.user")
    List<Promotion> findAllWithStore();
}
