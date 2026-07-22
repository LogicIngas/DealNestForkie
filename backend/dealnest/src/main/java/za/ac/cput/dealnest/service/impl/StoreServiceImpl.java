package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.service.IStoreService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class StoreServiceImpl implements IStoreService {

    private final IStoreRepository repository;

    public StoreServiceImpl(IStoreRepository repository) {
        this.repository = repository;
    }

    @Override
    public Store create(Store store) {
        return repository.save(store);
    }

    @Override
    public Store read(String storeId) {
        return repository.findById(storeId).orElse(null);
    }

    @Override
    public Store update(Store store) {
        return repository.save(store);
    }

    @Override
    public boolean delete(String storeId) {
        repository.deleteById(storeId);
        return true;
    }

    @Override
    public Optional<Store> findByEmail(String email) {
        return this.repository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }

    @Override
    public List<Store> findByCategory(StoreCategory category) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAll()){
            if (store.getCategory() != null &&
                    store.getCategory().equalsIgnoreCase(store)){
                result.add(store);
            }
        }
        return result;
    }

    @Override
    public List<Store> findByCity(String city) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAll()){
            if (store.getCity() != null &&
                    store.getCity().equalsIgnoreCase(city)){
                result.add(store);
            }
        }
        return result;
    }

    @Override
    public List<Store> findByIsActiveTrue() {
        return repository.findByIsActiveTrue();
    }

    @Override
    public List<Store> findByStoreNameContainingIgnoreCase(String storeName) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAll()){
            if (store.getStoreName() != null &&
                    store.getStoreName().equalsIgnoreCase(storeName)){
                result.add(store);
            }
        }
        return result;
    }

    @Override
    public List<Store> getAll() {
        return repository.findAll();
    }
}
