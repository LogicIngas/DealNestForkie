package za.ac.cput.dealnest.service.impl;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.service.IStoreService;
import za.ac.cput.dealnest.util.Helper;
import za.ac.cput.dealnest.util.InvalidEmailException;

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
        store.setEmail(requireValidEmail(store.getEmail()));
        return repository.save(store);
    }

    private String requireValidEmail(String email) {
        String normalised = Helper.normaliseEmail(email);
        if (!Helper.isValidEmail(normalised)) {
            throw new InvalidEmailException(normalised);
        }
        return normalised;
    }

    @Override
    public Store read(String storeId) {
        return repository.findDetailedById(storeId).orElse(null);
    }

    @Override
    public Store update(Store store) {
        // The store dashboard edits the contact address directly, so it needs the
        // same check registration gets — an invalid address here would replace a
        // good one on the public store page.
        if (store.getEmail() != null && !store.getEmail().isBlank()) {
            store.setEmail(requireValidEmail(store.getEmail()));
        }
        return repository.save(store);
    }

    @Override
    public boolean delete(String storeId) {
        repository.deleteById(storeId);
        return true;
    }

    @Override
    public Optional<Store> findByEmail(String email) {
        return this.repository.findByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(Helper.normaliseEmail(email));
    }

    @Override
    public List<Store> findByCategory(StoreCategory category) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAllWithOwner()){
            if (store.getCategory() != null && store.getCategory().equals(category)){
                result.add(store);
            }
        }
        return result;
    }

    @Override
    public List<Store> findByCity(String city) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAllWithOwner()){
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
    public List<Store> findActive(int limit) {
        return repository.findActive(PageRequest.ofSize(Math.max(limit, 1)));
    }

    @Override
    public List<Store> findByStoreNameContainingIgnoreCase(String storeName) {
        List<Store> result = new ArrayList<>();

        for (Store store : repository.findAllWithOwner()){
            if (store.getStoreName() != null &&
                    store.getStoreName().toLowerCase().contains(storeName.toLowerCase())){
                result.add(store);
            }
        }
        return result;
    }

    @Override
    public Optional<Store> findByUserId(String userId) {
        return repository.findDetailedByUserId(userId);
    }

    @Override
    public List<Store> getAll() {
        return repository.findAllWithOwner();
    }
}
