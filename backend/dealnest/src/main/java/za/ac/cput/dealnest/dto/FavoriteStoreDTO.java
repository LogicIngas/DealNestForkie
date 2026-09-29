package za.ac.cput.dealnest.dto;

import java.time.LocalDateTime;

public class FavoriteStoreDTO {
    private String favoriteStoreID;
    private String userID;
    private String storeID;
    private LocalDateTime addedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FavoriteStoreDTO() {
    }

    public FavoriteStoreDTO(String userID, String storeID) {
        this.userID = userID;
        this.storeID = storeID;
    }

    public String getFavoriteStoreID() {
        return favoriteStoreID;
    }

    public void setFavoriteStoreID(String favoriteStoreID) {
        this.favoriteStoreID = favoriteStoreID;
    }

    public String getUserID() {
        return userID;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public String getStoreID() {
        return storeID;
    }

    public void setStoreID(String storeID) {
        this.storeID = storeID;
    }

    public LocalDateTime getAddedDate() {
        return addedDate;
    }

    public void setAddedDate(LocalDateTime addedDate) {
        this.addedDate = addedDate;
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
