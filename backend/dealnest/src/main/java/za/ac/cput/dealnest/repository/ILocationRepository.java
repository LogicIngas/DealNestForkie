package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Location;

public interface ILocationRepository extends JpaRepository<Location, String> {
}
