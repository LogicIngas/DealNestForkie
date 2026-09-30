package za.ac.cput.dealnest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import za.ac.cput.dealnest.domain.User;

import java.util.Optional;

public interface IUserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // See IAdminService.getStats(). The user total is inherited from JpaRepository;
    // only the plan-tier breakdown is new, since that is the one the overview needs
    // and it is a filtered count rather than a row count.

    @Query("select count(u) from User u where u.planTier = za.ac.cput.dealnest.domain.UserPlanTier.PLUS")
    long countPlusPlan();

    /**
     * One page of the admin console's user list.
     *
     * <p>A plain entity page — a User is serialised without any association, so there is
     * nothing to fetch and nothing to count beyond the table.
     *
     * <p>Ordered by email with the id as a tiebreaker. Without a total order, OFFSET can
     * return a user on two pages and skip another, because the database is free to order
     * tied rows differently between statements — and email is not unique, since a person
     * can have more than one account.
     */
    @Query("select u from User u order by u.email asc, u.userID asc")
    Page<User> findAllForAdmin(Pageable pageable);
}
