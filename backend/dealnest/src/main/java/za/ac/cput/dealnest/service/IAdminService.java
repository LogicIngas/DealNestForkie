package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Admin;
import java.util.List;
import java.util.Optional;

public interface IAdminService extends IService<Admin, String> {
    Optional<Admin> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Admin> getAll();
}
