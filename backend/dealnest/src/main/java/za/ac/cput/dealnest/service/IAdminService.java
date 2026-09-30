package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.dto.AdminStatsDTO;
import za.ac.cput.dealnest.dto.PageResponse;

import java.util.List;
import java.util.Optional;

public interface IAdminService extends IService<Admin, String> {
    Optional<Admin> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Admin> login(String email, String password);
    List<Admin> getAll();

    /**
     * The overview's counts and category breakdown, aggregated in the database.
     *
     * <p>Global by design — there is no per-admin scoping anywhere in this schema, so
     * every admin sees the same numbers.
     */
    AdminStatsDTO getStats();

    /**
     * The newest deals, for the overview's activity table. {@code limit} is already
     * bounded by the caller.
     */
    List<Promotion> getRecentPromotions(int limit);

    /**
     * One page of each list the console's tabs draw, in the shape a "load more" needs.
     *
     * <p>Paged because the tabs previously asked for whole tables. The unpaged
     * {@code /api/stores} is left alone deliberately — Home and Explore genuinely need
     * every store, so the console gets its own endpoints rather than changing the
     * behaviour of a public one.
     *
     * <p>{@code page} is zero-based; {@code size} is already bounded by the caller.
     */
    PageResponse<Store> getStoresPage(int page, int size);

    PageResponse<User> getUsersPage(int page, int size);

    PageResponse<Promotion> getPromotionsPage(int page, int size);

    PageResponse<DealReport> getReportsPage(int page, int size);
}
