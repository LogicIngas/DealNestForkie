package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Admin;
import za.ac.cput.dealnest.repository.IAdminRepository;
import za.ac.cput.dealnest.service.IAdminService;

import java.util.List;
import java.util.Optional;

@Service
public class AdminServiceImpl implements IAdminService {

    private final IAdminRepository repository;

    public AdminServiceImpl(IAdminRepository repository) {
        this.repository = repository;
    }

    @Override
    public Admin create(Admin admin) {
        return repository.save(admin);
    }

    @Override
    public Admin read(String adminId) {
        return repository.findById(adminId).orElse(null);
    }

    @Override
    public Admin update(Admin admin) {
        return repository.save(admin);
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
    public List<Admin> getAll() {
        return repository.findAll();
    }
}
