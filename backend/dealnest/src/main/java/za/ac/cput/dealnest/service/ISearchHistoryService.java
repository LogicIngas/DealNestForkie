package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.SearchHistory;
import java.util.List;

public interface ISearchHistoryService extends IService<SearchHistory, String> {
    List<SearchHistory> findByUserId(String userId);
    List<SearchHistory> getAll();
}
