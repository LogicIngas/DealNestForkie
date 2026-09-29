package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Location;

import java.util.List;
import java.util.Optional;

public interface ILocationRepository extends JpaRepository<Location, String> {

    /**
     * The owner comes back with the location, since a Location is serialised with its
     * {@code user} field and that is a lazy to-one. To-one join, so no rows duplicated.
     */
    @Query("select l from Location l join fetch l.user where l.locationID = :locationID")
    Optional<Location> findDetailedById(@Param("locationID") String locationID);

    @Query("select l from Location l join fetch l.user")
    List<Location> findAllWithOwner();
}
