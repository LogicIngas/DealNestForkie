package za.ac.cput.dealnest.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IUserService;

import java.time.LocalDateTime;
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
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .map(this::registerDailyCheckIn);
    }

    @Override
    public User addPoints(String userId, int points) {
        User user = repository.findById(userId).orElse(null);
        if (user == null) return null;
        int current = user.getPoints() == null ? 0 : user.getPoints();
        user.setPoints(current + Math.max(0, points));
        return repository.save(user);
    }

    // Advances the daily check-in streak when the user logs in on a new day.
    private User registerDailyCheckIn(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last = user.getLastActivityDate();
        int current = user.getCurrentStreak();

        if (last == null) {
            user.setCurrentStreak(1);
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + 2);
        } else if (last.toLocalDate().equals(now.toLocalDate())) {
            // Already checked in today: streak and points stay as they are.
        } else if (last.toLocalDate().plusDays(1).equals(now.toLocalDate())) {
            user.setCurrentStreak(current + 1);
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + 2);
        } else {
            // Streak broken: restart.
            user.setCurrentStreak(1);
            user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + 2);
        }

        user.setLongestStreak(Math.max(user.getLongestStreak(), user.getCurrentStreak()));
        user.setLastActivityDate(now);
        return repository.save(user);
    }

    @Override
    public List<User> getAll() {
        return repository.findAll();
    }
}
