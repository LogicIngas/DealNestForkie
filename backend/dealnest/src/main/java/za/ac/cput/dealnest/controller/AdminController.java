package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.security.JwtUtil;
import za.ac.cput.dealnest.service.IAdminService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class AdminController {

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
}
