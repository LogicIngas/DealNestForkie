package za.ac.cput.dealnest.service.impl;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.dto.AdminStatsDTO;
import za.ac.cput.dealnest.dto.PageResponse;
import za.ac.cput.dealnest.dto.StoreCategoryCountDTO;
import za.ac.cput.dealnest.repository.IAdminRepository;
import za.ac.cput.dealnest.repository.IDealReportRepository;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IAdminService;
import za.ac.cput.dealnest.util.Helper;
import za.ac.cput.dealnest.util.InvalidEmailException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AdminServiceImpl implements IAdminService {

    private final IAdminRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final IStoreRepository storeRepository;
    private final IUserRepository userRepository;
    private final IPromotionRepository promotionRepository;
    private final IDealReportRepository dealReportRepository;

    public AdminServiceImpl(IAdminRepository repository,
                            PasswordEncoder passwordEncoder,
                            IStoreRepository storeRepository,
                            IUserRepository userRepository,
                            IPromotionRepository promotionRepository,
                            IDealReportRepository dealReportRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.promotionRepository = promotionRepository;
        this.dealReportRepository = dealReportRepository;
    }

    @Override
    public Admin create(Admin admin) {
        admin.setEmail(requireValidEmail(admin.getEmail()));
        // Client submits the raw password in the passwordHash field; hash it before persisting.
        admin.setPasswordHash(passwordEncoder.encode(admin.getPasswordHash()));
        return repository.save(admin);
    }

    private String requireValidEmail(String email) {
        String normalised = Helper.normaliseEmail(email);
        if (!Helper.isValidEmail(normalised)) {
            throw new InvalidEmailException(normalised);
        }
        return normalised;
    }

    @Override
    public Admin read(String adminId) {
        return repository.findById(adminId).orElse(null);
    }

    @Override
    public Admin update(Admin admin) {
        // Load-then-merge rather than save(admin). save() on an entity whose id is
        // null inserts a new row, and on an entity missing the password column it
        // would overwrite the stored hash with null and lock the admin out.
        Admin existing = repository.findById(admin.getAdminID()).orElse(null);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found.");
        }
        if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
            existing.setEmail(requireValidEmail(admin.getEmail()));
        }
        if (admin.getActive() != null) {
            existing.setActive(admin.getActive());
        }
        // A supplied password arrives in the same field as a stored bcrypt hash, so
        // it is only re-encoded when it is actually a new plaintext value.
        String password = admin.getPasswordHash();
        if (password != null && !password.isBlank() && !isBcryptHash(password)) {
            existing.setPasswordHash(passwordEncoder.encode(password));
        }
        return repository.save(existing);
    }

    private boolean isBcryptHash(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    @Override
    public boolean delete(String adminId) {
        repository.deleteById(adminId);
        return true;
    }

    @Override
    public Optional<Admin> findByEmail(String email) {
        return repository.findByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public Optional<Admin> login(String email, String password) {
        if (!Helper.isValidEmail(email)) {
            return Optional.empty();
        }
        return repository.findByEmail(Helper.normaliseEmail(email))
                // A deactivated admin has to be refused here, not just hidden in the
                // admin list: without this check they could still sign in and the
                // server would mint a fresh long-lived ROLE_ADMIN token for them.
                .filter(admin -> !Boolean.FALSE.equals(admin.getActive()))
                .filter(admin -> passwordEncoder.matches(password, admin.getPasswordHash()));
    }

    @Override
    public List<Admin> getAll() {
        return repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsDTO getStats() {
        // Every number the overview draws, as a database count.
        //
        // These replace a client that fetched all four tables in full and ran
        // Array.filter over the results — including findAllWithStore(), which joins
        // store and owner, so the page cost the whole promotions table joined twice to
        // produce nine numbers and a category chart. Cost now scales with the index,
        // not the row count.
        //
        // Read-only: nothing here writes, and the aggregate never materialises an
        // entity, so there is nothing for the session to flush on the way out.
        AdminStatsDTO stats = new AdminStatsDTO();

        stats.setTotalStores(storeRepository.count());
        stats.setActiveStores(storeRepository.countActive());
        stats.setUnverifiedStores(storeRepository.countUnverified());
        stats.setProStores(storeRepository.countProPlan());

        stats.setTotalUsers(userRepository.count());
        stats.setPlusUsers(userRepository.countPlusPlan());

        stats.setTotalPromotions(promotionRepository.count());
        stats.setActivePromotions(promotionRepository.countActive());

        stats.setTotalReports(dealReportRepository.count());
        stats.setPendingReports(dealReportRepository.countByStatus(DealReportStatus.PENDING));

        stats.setStoresByCategory(toCategoryCounts(storeRepository.countByCategory()));
        stats.setStoreOwnerIds(storeRepository.findDistinctOwnerIds());
        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Promotion> getRecentPromotions(int limit) {
        // The activity table draws a fixed handful of rows. It was previously fed by the
        // full promotions list — every deal joined to its store and owner — sorted in the
        // browser and truncated to eight, so the overview cost the whole table to show
        // eight. findRecent stops at the limit instead.
        //
        // The store is fetched because the table prints the store name. The owner is not:
        // nothing on this panel reads it, and joining for it would multiply the rows the
        // database has to carry back for no gain.
        return promotionRepository.findRecent(PageRequest.of(0, limit));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<Store> getStoresPage(int page, int size) {
        return PageResponse.of(storeRepository.findAllForAdmin(PageRequest.of(page, size)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<User> getUsersPage(int page, int size) {
        return PageResponse.of(userRepository.findAllForAdmin(PageRequest.of(page, size)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<Promotion> getPromotionsPage(int page, int size) {
        return PageResponse.of(promotionRepository.findAllForAdmin(PageRequest.of(page, size)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DealReport> getReportsPage(int page, int size) {
        return PageResponse.of(dealReportRepository.findAllForAdmin(PageRequest.of(page, size)));
    }

    private List<StoreCategoryCountDTO> toCategoryCounts(List<Object[]> rows) {
        List<StoreCategoryCountDTO> counts = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            // The projection is (category, count) and count is never null, but the
            // category column is only NOT NULL in the entity mapping — a row that
            // predates it would come back as a null here rather than as a missing row.
            StoreCategory category = (StoreCategory) row[0];
            counts.add(new StoreCategoryCountDTO(category, ((Number) row[1]).longValue()));
        }
        // The chart is a single series of counts, so it reads best largest-first. The
        // database makes no ordering promise for a GROUP BY without one, and the bar
        // widths are computed against the maximum, so the order is part of what the
        // chart shows rather than incidental. Count descending, then name, so ties
        // have a stable order instead of depending on the grouping.
        counts.sort(Comparator.comparingLong(StoreCategoryCountDTO::getCount).reversed()
                .thenComparing(c -> c.getCategory() == null ? "" : c.getCategory().name()));
        return counts;
    }
}
