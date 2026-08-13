package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Location;
import za.ac.cput.dealnest.service.ILocationService;

import java.util.List;

@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class LocationController {

    private final ILocationService locationService;

    @Autowired
    public LocationController(ILocationService locationService) {
        this.locationService = locationService;
    }

    @PostMapping("/create")
    public Location create(@RequestBody Location location) {
        return locationService.create(location);
    }

    @GetMapping("/read/{locationId}")
    public Location read(@PathVariable String locationId) {
        return locationService.read(locationId);
    }

    @PutMapping("/update/{locationId}")
    public Location update(@PathVariable String locationId,@RequestBody Location location) {
        return locationService.update(location);
    }

    @DeleteMapping("/delete/{locationId}")
    public boolean delete(@PathVariable String locationId) {
        return locationService.delete(locationId);
    }

    @GetMapping("/getAll")
    public List<Location> getAll() {
        return locationService.getAll();
    }
}
