package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.service.IFavoriteStoreService;

import java.util.List;

@RestController
@RequestMapping("/api/favoriteStore")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class FavoriteStoreController {

    private final IFavoriteStoreService favoriteStoreService;

    @Autowired
    public FavoriteStoreController(IFavoriteStoreService favoriteStoreService) {
        this.favoriteStoreService = favoriteStoreService;
    }

    @PostMapping("/create")
    public FavoriteStore create(@RequestBody FavoriteStore favoriteStore) {
        return favoriteStoreService.create(favoriteStore);
    }

    @GetMapping("/read/{favoriteStoreId}")
    public FavoriteStore read(String favoriteStoreId) {
        return favoriteStoreService.read(favoriteStoreId);
    }

    @PutMapping("/update/{favoriteStoreId}")
    public FavoriteStore update(@PathVariable String storeId,@RequestBody FavoriteStore favoriteStore) {
        return favoriteStoreService.update(favoriteStore);
    }

    @DeleteMapping("/delete/{favoriteStoreId}")
    public boolean delete(@PathVariable String favoriteStoreId) {
        favoriteStoreService.delete(favoriteStoreId);
        return true;
    }

    @GetMapping("/findByUserId/{userId}")
    public List<FavoriteStore> findByUserId(@PathVariable String userId) {
        return favoriteStoreService.findByUserId(userId);
    }

    @GetMapping("/findByStoreId/{storeId}")
    public List<FavoriteStore> findByStoreId(@PathVariable String storeId) {
        return favoriteStoreService.findByStoreId(storeId);
    }

    @GetMapping("/getAll")
    public List<FavoriteStore> getAll() {
        return favoriteStoreService.getAll();
    }
}
