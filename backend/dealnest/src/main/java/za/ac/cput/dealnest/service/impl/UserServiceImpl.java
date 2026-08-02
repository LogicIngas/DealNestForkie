package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements IUserService {

    private final IUserRepository repository;

    public UserServiceImpl(IUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public User create(User user) {
        return repository.save(user);
    }

    @Override
    public User read(String userId) {
        return repository.findById(userId).orElse(null);
    }

    @Override
    public User update(User user) {
        return repository.save(user);
    }

    @Override
    public boolean delete(String userId) {
        repository.deleteById(userId);
        return true;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }

    @Override
    public Optional<User> login(String email, String password) {
        return repository.findByEmailAndPassword(email, password);
    }

    @Override
    public List<User> getAll() {
        return repository.findAll();
    }
}
