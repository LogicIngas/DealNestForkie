package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.SearchHistory;
import za.ac.cput.dealnest.service.ISearchHistoryService;

import java.util.List;

@RestController
@RequestMapping("/api/searchHistory")
@CrossOrigin(origins = "http://localhost:3000")
public class SearchHistoryController {

    private final ISearchHistoryService searchHistoryService;


    @Autowired
    public SearchHistoryController(ISearchHistoryService searchHistoryService) {
        this.searchHistoryService = searchHistoryService;
    }

    @PostMapping("/create")
    public SearchHistory create(@RequestBody SearchHistory searchHistory) {
        return searchHistoryService.create(searchHistory);
    }

    @GetMapping("/read/{searchHistoryId}")
    public SearchHistory read(@PathVariable String searchHistoryId) {
        return searchHistoryService.read(searchHistoryId);
    }

    @PutMapping("/update/{searchHistoryId}")
    public SearchHistory update(@PathVariable String searchHistoryId,@RequestBody SearchHistory searchHistory) {
        return searchHistoryService.update(searchHistory);
    }

    @DeleteMapping("/delete/{searchHistoryId}")
    public boolean delete(@PathVariable String searchHistoryId) {
        return searchHistoryService.delete(searchHistoryId);
    }

    @GetMapping("/findByUserId/{userId}")
    public List<SearchHistory> findByUserId(@PathVariable String userId) {
        return searchHistoryService.findByUserId(userId);
    }

    @GetMapping("/getAll")
    public List<SearchHistory> getAll() {
        return searchHistoryService.getAll();
    }
}
