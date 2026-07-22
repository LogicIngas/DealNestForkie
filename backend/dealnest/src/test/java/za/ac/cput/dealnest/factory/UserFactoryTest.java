package za.ac.cput.dealnest.factory;

import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.User;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class UserFactoryTest {

    @Test
    void createUser() {

        User user = UserFactory.createUser(
                "john@example.com",
                "Password123",
                "John",
                "Doe",
                "0821234567",
                -33.9249,
                18.4241,
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNotNull(user);
        assertEquals("john@example.com", user.getEmail());
        assertEquals("Password123", user.getPassword());
        assertEquals("John", user.getFirstName());
        assertEquals("Doe", user.getLastName());
        assertEquals("0821234567", user.getPhoneNumber());
        assertTrue(user.isActive());

        // UUID is generated only after saving with JPA
        assertNull(user.getUserID());
    }

    @Test
    void createUserWithInvalidEmail() {

        User user = UserFactory.createUser(
                "invalid-email",
                "Password123",
                "John",
                "Doe",
                "0821234567",
                -33.9249,
                18.4241,
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNull(user);
    }

    @Test
    void createUserWithEmptyFirstName() {

        User user = UserFactory.createUser(
                "john@example.com",
                "Password123",
                "",
                "Doe",
                "0821234567",
                -33.9249,
                18.4241,
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNull(user);
    }
}