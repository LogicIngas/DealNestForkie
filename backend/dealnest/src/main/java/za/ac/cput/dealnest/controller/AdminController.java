package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.service.IAdminService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final IAdminService adminService;

    @Autowired
    public AdminController(IAdminService adminService) {
        this.adminService = adminService;
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
    public Admin update(@PathVariable String userId, @RequestBody Admin admin) {
        return adminService.update(admin);
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
