package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.SearchHistory;
import java.util.List;
import java.util.Optional;

public interface ISearchHistoryRepository extends JpaRepository<SearchHistory, String> {

    /**
     * The owner comes back with every search entry.
     *
     * <p>A SearchHistory is serialised with its {@code user} field and that is a lazy
     * to-one, so listing them without the join cost one extra query per row. To-one
     * join, so no rows are duplicated. Served by idx_search_history_user.
     */
    @Query("select sh from SearchHistory sh join fetch sh.user where sh.user.userID = :userID")
    List<SearchHistory> findByUser_UserID(String userID);

    @Query("select sh from SearchHistory sh join fetch sh.user where sh.searchID = :searchID")
    Optional<SearchHistory> findDetailedById(@Param("searchID") String searchID);
}
