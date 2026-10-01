package za.ac.cput.dealnest.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IUserService;
import za.ac.cput.dealnest.util.Helper;
import za.ac.cput.dealnest.util.InvalidEmailException;
import za.ac.cput.dealnest.util.EmailAlreadyRegisteredException;

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
        String email = requireValidEmail(user.getEmail());

        // Hash the plaintext password before persisting
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // Normalise before the uniqueness check so "sam@x.co.za" and
        // "sam@x.co.za " can't both claim the same address.
        user.setEmail(email);

        if (repository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException(email);
        }

        return repository.save(user);
    }

    private String requireValidEmail(String email) {
        String normalised = Helper.normaliseEmail(email);
        if (!Helper.isValidEmail(normalised)) {
            throw new InvalidEmailException(normalised);
        }
        return normalised;
    }

    @Override
    public User read(String userId) {
        return repository.findById(userId).orElse(null);
    }

    @Override
    public User update(User user) {
        String userId = user.getUserID();
        if (userId == null) {
            throw new IllegalArgumentException("User id is required for update.");
        }
        User existing = repository.findById(userId).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("User not found for id: " + userId);
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String email = requireValidEmail(user.getEmail());
            // A profile edit must not silently move an account onto an address
            // another user already holds.
            if (!email.equalsIgnoreCase(existing.getEmail()) && repository.existsByEmail(email)) {
                throw new EmailAlreadyRegisteredException(email);
            }
            existing.setEmail(email);
        }
        existing.setFirstName(user.getFirstName());
        existing.setLastName(user.getLastName());
        existing.setPhoneNumber(user.getPhoneNumber());
        existing.setLatitude(user.getLatitude());
        existing.setLongitude(user.getLongitude());
        existing.setActive(user.isActive());
        existing.setPlanTier(user.getPlanTier());
        existing.setPlanRenewsAt(user.getPlanRenewsAt());
        existing.setUpdatedAt(LocalDateTime.now());

        String password = user.getPassword();
        if (password != null && !password.isBlank() && !isBcryptHash(password)) {
            existing.setPassword(passwordEncoder.encode(password));
        }

        return repository.save(existing);
    }

    private boolean isBcryptHash(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    @Override
    public boolean delete(String userId) {
        repository.deleteById(userId);
        return true;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public Optional<User> login(String email, String password) {
        // A malformed address can't match a stored one, so rejecting it here
        // just saves the caller from a misleading "incorrect email or password".
        if (!Helper.isValidEmail(email)) {
            return Optional.empty();
        }
        return repository.findByEmail(Helper.normaliseEmail(email))
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
