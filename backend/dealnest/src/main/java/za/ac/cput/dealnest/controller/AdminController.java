package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.dto.AdminStatsDTO;
import za.ac.cput.dealnest.dto.PageResponse;
import za.ac.cput.dealnest.security.JwtUtil;
import za.ac.cput.dealnest.service.IAdminService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class AdminController {

    /** Cards per tab page. Enough to fill the grid a few times over on a laptop. */
    private static final int DEFAULT_PAGE_SIZE = 24;

    /** Ceiling on what a caller can ask for in one page. */
    private static final int MAX_PAGE_SIZE = 100;

    private final IAdminService adminService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AdminController(IAdminService adminService, JwtUtil jwtUtil) {
        this.adminService = adminService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/create")
    public Admin create(@RequestBody Admin admin) {
        return adminService.create(admin);
    }

    @GetMapping("/read/{adminId}")
    public Admin read(@PathVariable String adminId) {
        return adminService.read(adminId);
    }

    @PutMapping("/update/{adminId}")
    public Admin update(@PathVariable String adminId, @RequestBody Admin admin) {
        // The id has to come from the path, not the body. Passing the body straight
        // through meant an entity with a null @Id reached save(), which Hibernate
        // treats as a fresh insert — so "update admin X" quietly created a second
        // admin row instead of changing anything.
        admin.setAdminID(adminId);
        return adminService.update(admin);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Admin credentials) {
        return adminService.login(credentials.getEmail(), credentials.getPasswordHash())
                .<ResponseEntity<?>>map(admin -> {
                    String token = jwtUtil.generateAdminToken(admin.getAdminID(), admin.getEmail());
                    return ResponseEntity.ok(Map.of("token", token, "admin", admin));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Incorrect email or password.")));
    }

    @DeleteMapping("/delete/{adminId}")
    public boolean delete(@PathVariable String adminId) {
        return adminService.delete(adminId);
    }

    @GetMapping("/findByEmail/{email}")
    public Optional<Admin> findByEmail(@PathVariable String email) {
        return adminService.findByEmail(email);
    }

    @GetMapping("/existsByEmail/{email}")
    public boolean existsByEmail(@PathVariable String email) {
        return adminService.existsByEmail(email);
    }

    @GetMapping("/getAll")
    public List<Admin> getAll() {
        return adminService.getAll();
    }

    /**
     * The overview's counts, aggregated in the database.
     *
     * <p>Exists so the console can draw its numbers without downloading the tables it
     * was counting. See IAdminService.getStats().
     */
    @GetMapping("/stats")
    public AdminStatsDTO getStats() {
        return adminService.getStats();
    }

    /**
     * The newest deals for the overview's activity table.
     *
     * <p>A bounded list so that panel no longer rides on the full promotions table.
     * Capped server-side for the same reason as the feed's limit: a parameter meant to
     * stop a "send me everything" request is pointless if a large one still works.
     */
    @GetMapping("/recent-promotions")
    public List<Promotion> getRecentPromotions(
            @RequestParam(defaultValue = "8") int limit) {
        return adminService.getRecentPromotions(clampLimit(limit, 8, 50));
    }

    // -----------------------------------------------------------------------
    // Paged tab lists
    //
    // Separate from the public /api/stores and /api/user/getAll because those
    // are shared with the customer site: Home and Explore need every store, and
    // a store owner needs the whole user list they are entitled to. Paging them
    // would change what the shopfront receives, so the console asks for its own
    // pages instead. See IAdminService for the service side.
    // -----------------------------------------------------------------------

    @GetMapping("/stores")
    public PageResponse<Store> getStores(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "24") int size) {
        return adminService.getStoresPage(page, clampSize(size));
    }

    @GetMapping("/users")
    public PageResponse<User> getUsers(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "24") int size) {
        return adminService.getUsersPage(page, clampSize(size));
    }

    @GetMapping("/promotions")
    public PageResponse<Promotion> getPromotions(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "24") int size) {
        return adminService.getPromotionsPage(page, clampSize(size));
    }

    @GetMapping("/reports")
    public PageResponse<DealReport> getReports(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "24") int size) {
        return adminService.getReportsPage(page, clampSize(size));
    }

    private static int clampLimit(int requested, int fallback, int max) {
        if (requested < 1) {
            return fallback;
        }
        return Math.min(requested, max);
    }

    /**
     * A page size is bounded for the same reason a limit is: a parameter meant to stop a
     * "send me everything" request is pointless if {@code ?size=2000000000} still works.
     *
     * <p>Zero and negatives fall back to the default rather than being clamped up to 1.
     * {@code PageRequest} rejects a non-positive size outright, so turning a bad request
     * into a 400 here would be a worse answer than serving one ordinary page.
     */
    private static int clampSize(int requested) {
        if (requested < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requested, MAX_PAGE_SIZE);
    }
}
