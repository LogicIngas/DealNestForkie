package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.SearchHistory;
import za.ac.cput.dealnest.repository.ISearchHistoryRepository;
import za.ac.cput.dealnest.service.ISearchHistoryService;

import java.util.List;

@Service
public class SearchHistoryServiceImpl implements ISearchHistoryService {

    private final ISearchHistoryRepository repository;

    public SearchHistoryServiceImpl(ISearchHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public SearchHistory create(SearchHistory searchHistory) {
        return repository.save(searchHistory);
    }

    @Override
    public SearchHistory read(String searchHistoryId) {
        return repository.findDetailedById(searchHistoryId).orElse(null);
    }

    @Override
    public SearchHistory update(SearchHistory searchHistory) {
        return repository.save(searchHistory);
    }

    @Override
    public boolean delete(String searchHistoryId) {
        repository.deleteById(searchHistoryId);
        return true;
    }

    @Override
    public List<SearchHistory> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<SearchHistory> getAll() {
        return repository.findAll();
    }
}
