package za.ac.cput.dealnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {
    private final IStoreService storeService;

    public StoreController(IStoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    public List<Store> getAllStores() {
        return storeService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Store> getStoreById(@PathVariable String id) {
        Store store = storeService.read(id);
        return store != null ? ResponseEntity.ok(store) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Store createStore(@RequestBody Store store) {
        return storeService.create(store);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Store> updateStore(@PathVariable String id, @RequestBody Store store) {
        if (!id.equals(store.getStoreId())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(storeService.update(store));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable String id) {
        storeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
