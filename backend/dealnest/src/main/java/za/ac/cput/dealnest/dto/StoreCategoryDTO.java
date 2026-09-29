package za.ac.cput.dealnest.dto;

public class StoreCategoryDTO {
    private String category;
    private String description;

    public StoreCategoryDTO() {
    }

    public StoreCategoryDTO(String category, String description) {
        this.category = category;
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
