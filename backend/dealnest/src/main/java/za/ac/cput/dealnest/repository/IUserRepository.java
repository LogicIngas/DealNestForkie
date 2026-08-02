package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.User;

import java.util.Optional;

public interface IUserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmailAndPassword(String email, String password);
}
