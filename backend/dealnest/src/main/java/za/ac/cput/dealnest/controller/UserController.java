package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")

public class UserController {

    private final IUserService userService;

    @Autowired
    public UserController(IUserService userService) {
        this.userService = userService;
    }

    @PostMapping("/create")
    public User create(@RequestBody User user) {
            return userService.create(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User credentials) {
        return userService.login(credentials.getEmail(), credentials.getPassword())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Incorrect email or password.")));
    }

    @GetMapping("/read/{userId}")
    public User read(@PathVariable String userId) {
        return userService.read(userId);
    }

    @PutMapping("/update/{userId}")
    public User update(@PathVariable String userId, @RequestBody User user) {
        return userService.update(user);
    }

    @DeleteMapping("/delete/{userId}")
    public boolean delete(@PathVariable String userId) {
        return userService.delete(userId);
    }

    @GetMapping("/findByEmail/{email}")
    public Optional<User> findByEmail(@PathVariable String email) {
        return userService.findByEmail(email);
    }

    @GetMapping("/existsByEmail/{email}")
    public boolean existsByEmail(@PathVariable String email) {
        return userService.existsByEmail(email);
    }

    @GetMapping("/getAll")
    public List<User> getAll() {
        return userService.getAll();
    }
}
