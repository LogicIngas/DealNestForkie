package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.User;

import java.util.List;
import java.util.Optional;

public interface IUserService extends IService<User, String> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> login(String email, String password);

    List<User> getAll();

    User addPoints(String userId, int points);
}