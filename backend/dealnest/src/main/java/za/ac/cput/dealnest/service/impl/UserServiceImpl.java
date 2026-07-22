package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.service.IUserService;

import java.util.Optional;

@Service
public class UserServiceImpl implements IUserService {

    private final IUserRepository repository;

    public UserServiceImpl(IUserRepository repository) {
        this.repository = repository;
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
    public boolean delete(String userId) {
         repository.deleteById(userId);
        return true;
    }
}
