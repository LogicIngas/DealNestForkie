package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Location;
import za.ac.cput.dealnest.repository.ILocationRepository;
import za.ac.cput.dealnest.service.ILocationService;

import java.util.List;

@Service
public class LocationServiceImpl implements ILocationService {

    private final ILocationRepository repository;

    public LocationServiceImpl(ILocationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Location create(Location location) {
        return repository.save(location);
    }

    @Override
    public Location read(String locationId) {
        return repository.findDetailedById(locationId).orElse(null);
    }

    @Override
    public Location update(Location location) {
        return repository.save(location);
    }

    @Override
    public boolean delete(String locationId) {
        repository.deleteById(locationId);
        return true;
    }

    @Override
    public List<Location> getAll() {
        return repository.findAll();
    }
}
