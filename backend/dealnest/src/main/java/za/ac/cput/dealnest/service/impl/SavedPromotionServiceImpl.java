package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.SavedPromotion;
import za.ac.cput.dealnest.repository.ISavedPromotionRepository;
import za.ac.cput.dealnest.service.ISavedPromotionService;

import java.util.List;

@Service
public class SavedPromotionServiceImpl implements ISavedPromotionService {

    private final ISavedPromotionRepository repository;

    public SavedPromotionServiceImpl(ISavedPromotionRepository repository) {
        this.repository = repository;
    }

    @Override
    public SavedPromotion create(SavedPromotion savedPromotion) {
        return repository.save(savedPromotion);
    }

    @Override
    public SavedPromotion read(String savedPromotionId) {
        return repository.findById(savedPromotionId).orElse(null);
    }

    @Override
    public SavedPromotion update(SavedPromotion savedPromotion) {
        return repository.save(savedPromotion);
    }

    @Override
    public boolean delete(String savedPromotionId) {
        repository.deleteById(savedPromotionId);
        return true;
    }

    @Override
    public List<SavedPromotion> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<SavedPromotion> findByPromotionId(String promotionId) {
        return repository.findByPromotion_PromotionID(promotionId);
    }

    @Override
    public List<SavedPromotion> getAll() {
        return repository.findAll();
    }
}
