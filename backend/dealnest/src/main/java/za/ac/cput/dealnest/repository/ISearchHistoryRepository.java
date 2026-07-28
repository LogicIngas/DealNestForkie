package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.SearchHistory;
import java.util.List;

public interface ISearchHistoryRepository extends JpaRepository<SearchHistory, String> {
    List<SearchHistory> findByUser_UserID(String userID);
}
