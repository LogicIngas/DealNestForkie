package za.ac.cput.dealnest.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * The admin overview's numbers, counted by the database.
 *
 * <p>The console used to draw these by downloading four whole tables and counting the
 * rows in the browser — every store, user, promotion and report, with the store and
 * owner joins those serialisations need. That cost grew with the size of the database
 * rather than with the nine numbers on screen, and on a real dataset it was the
 * difference between the overview appearing and taking the best part of a minute.
 *
 * <p>These are the same counts the browser was deriving, moved into SQL. The predicates
 * are written to match the filters they replace exactly, including the JavaScript
 * truthiness rules — see the repository methods for the null cases.
 */
public class AdminStatsDTO {

    private long totalStores;
    private long activeStores;
    private long unverifiedStores;
    private long proStores;
    private long totalUsers;
    private long plusUsers;
    private long totalPromotions;
    private long activePromotions;
    private long totalReports;
    private long pendingReports;

    /** Store count per category, for the overview's bar chart. */
    private List<StoreCategoryCountDTO> storesByCategory = new ArrayList<>();

    /**
     * The user IDs that own a store, for the "Store" badge on the users tab.
     *
     * <p>Included here because the tab list is loaded on demand: the badge used to be
     * derived from the stores array, which meant the users tab only showed it to an admin
     * who had already opened the stores tab. A distinct list of ids is one cheap indexed
     * projection and makes the badge independent of tab order.
     */
    private List<String> storeOwnerIds = new ArrayList<>();

    public AdminStatsDTO() {
    }

    public long getTotalStores() {
        return totalStores;
    }

    public void setTotalStores(long totalStores) {
        this.totalStores = totalStores;
    }

    public long getActiveStores() {
        return activeStores;
    }

    public void setActiveStores(long activeStores) {
        this.activeStores = activeStores;
    }

    public long getUnverifiedStores() {
        return unverifiedStores;
    }

    public void setUnverifiedStores(long unverifiedStores) {
        this.unverifiedStores = unverifiedStores;
    }

    public long getProStores() {
        return proStores;
    }

    public void setProStores(long proStores) {
        this.proStores = proStores;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getPlusUsers() {
        return plusUsers;
    }

    public void setPlusUsers(long plusUsers) {
        this.plusUsers = plusUsers;
    }

    public long getTotalPromotions() {
        return totalPromotions;
    }

    public void setTotalPromotions(long totalPromotions) {
        this.totalPromotions = totalPromotions;
    }

    public long getActivePromotions() {
        return activePromotions;
    }

    public void setActivePromotions(long activePromotions) {
        this.activePromotions = activePromotions;
    }

    public long getTotalReports() {
        return totalReports;
    }

    public void setTotalReports(long totalReports) {
        this.totalReports = totalReports;
    }

    public long getPendingReports() {
        return pendingReports;
    }

    public void setPendingReports(long pendingReports) {
        this.pendingReports = pendingReports;
    }

    public List<StoreCategoryCountDTO> getStoresByCategory() {
        return storesByCategory;
    }

    public void setStoresByCategory(List<StoreCategoryCountDTO> storesByCategory) {
        this.storesByCategory = storesByCategory;
    }

    public List<String> getStoreOwnerIds() {
        return storeOwnerIds;
    }

    public void setStoreOwnerIds(List<String> storeOwnerIds) {
        this.storeOwnerIds = storeOwnerIds;
    }
}
