package za.ac.cput.dealnest.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.repository.IAdminRepository;
import za.ac.cput.dealnest.service.IAdminService;

import java.util.List;
import java.util.Optional;

@Service
public class AdminServiceImpl implements IAdminService {

    private final IAdminRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(IAdminRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Admin create(Admin admin) {
        // Client submits the raw password in the passwordHash field; hash it before persisting.
        admin.setPasswordHash(passwordEncoder.encode(admin.getPasswordHash()));
        return repository.save(admin);
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
            existing.setEmail(admin.getEmail());
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
        return repository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }

    @Override
    public Optional<Admin> login(String email, String password) {
        return repository.findByEmail(email)
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
}
