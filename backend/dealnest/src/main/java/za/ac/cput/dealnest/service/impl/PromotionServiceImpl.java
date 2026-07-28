package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.service.IPromotionService;

import java.util.List;

@Service
public class PromotionServiceImpl implements IPromotionService {

    private final IPromotionRepository repository;

    public PromotionServiceImpl(IPromotionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Promotion create(Promotion promotion) {
        return repository.save(promotion);
    }

    @Override
    public Promotion read(String promotionId) {
        return repository.findById(promotionId).orElse(null);
    }

    @Override
    public Promotion update(Promotion promotion) {
        return repository.save(promotion);
    }

    @Override
    public boolean delete(String promotionId) {
        repository.deleteById(promotionId);
        return true;
    }

    @Override
    public List<Promotion> findByStoreId(String storeId) {
        return repository.findByStore_StoreId(storeId);
    }

    @Override
    public List<Promotion> findByIsActiveTrue() {
        return repository.findByIsActiveTrue();
    }

    @Override
    public List<Promotion> getAll() {
        return repository.findAll();
    }
}
