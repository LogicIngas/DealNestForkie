package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "http://localhost:3000") // Enable React frontend access and communication
public class StoreController {
    
    private final IStoreService storeService;

    @Autowired
    public StoreController(IStoreService storeService) {
        this.storeService = storeService;
    }

    @PostMapping
    public Store createStore(@RequestBody Store store) {
        return storeService.create(store);
    }

    @GetMapping("/{id}")
    public Store getStoreById(@PathVariable String id) {
        return storeService.read(id);
    }

    @PutMapping("/{id}")
    public Store updateStore(@PathVariable String id, @RequestBody Store store) {
        return storeService.update(store);
    }

    
    @DeleteMapping("/{id}")
    public void deleteStore(@PathVariable String id) {
        storeService.delete(id);
    }

    @GetMapping
    public List<Store> getAllStores() {
        return storeService.getAll();
    }
}
