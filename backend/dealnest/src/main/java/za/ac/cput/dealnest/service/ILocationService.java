package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Location;
import java.util.List;

public interface ILocationService extends IService<Location, String> {
    List<Location> getAll();
}
