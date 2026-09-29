package za.ac.cput.dealnest.dto;

import java.time.LocalDateTime;

public class SavedPromotionDTO {
    private String savedPromotionID;
    private String userID;
    private String promotionID;
    private LocalDateTime savedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SavedPromotionDTO() {
    }

    public SavedPromotionDTO(String userID, String promotionID) {
        this.userID = userID;
        this.promotionID = promotionID;
    }

    public String getSavedPromotionID() {
        return savedPromotionID;
    }

    public void setSavedPromotionID(String savedPromotionID) {
        this.savedPromotionID = savedPromotionID;
    }

    public String getUserID() {
        return userID;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public String getPromotionID() {
        return promotionID;
    }

    public void setPromotionID(String promotionID) {
        this.promotionID = promotionID;
    }

    public LocalDateTime getSavedDate() {
        return savedDate;
    }

    public void setSavedDate(LocalDateTime savedDate) {
        this.savedDate = savedDate;
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
