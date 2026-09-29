package za.ac.cput.dealnest.dto;

import java.time.LocalDateTime;

public class SearchHistoryDTO {
    private String searchHistoryID;
    private String userID;
    private String searchQuery;
    private LocalDateTime searchDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SearchHistoryDTO() {
    }

    public SearchHistoryDTO(String userID, String searchQuery) {
        this.userID = userID;
        this.searchQuery = searchQuery;
    }

    public String getSearchHistoryID() {
        return searchHistoryID;
    }

    public void setSearchHistoryID(String searchHistoryID) {
        this.searchHistoryID = searchHistoryID;
    }

    public String getUserID() {
        return userID;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
    }

    public LocalDateTime getSearchDate() {
        return searchDate;
    }

    public void setSearchDate(LocalDateTime searchDate) {
        this.searchDate = searchDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
