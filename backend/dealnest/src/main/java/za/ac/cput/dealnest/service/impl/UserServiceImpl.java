package za.ac.cput.dealnest.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements IUserService {

    private final IUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(IUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User create(User user) {
        // Hash the plaintext password before persisting
        user.setPassword(passwordEncoder.encode(user.getPassword()));
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
        return repository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }

    @Override
    public List<User> getAll() {
        return repository.findAll();
    }
}
