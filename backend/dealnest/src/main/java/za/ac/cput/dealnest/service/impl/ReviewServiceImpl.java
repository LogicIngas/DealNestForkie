package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.repository.IReviewRepository;
import za.ac.cput.dealnest.service.IReviewService;

import java.util.List;

@Service
public class ReviewServiceImpl implements IReviewService {

    private final IReviewRepository repository;

    public ReviewServiceImpl(IReviewRepository repository) {
        this.repository = repository;
    }

    @Override
    public Review create(Review review) {
        return repository.save(review);
    }

    @Override
    public Review read(String reviewId) {
        return repository.findById(reviewId).orElse(null);
    }

    @Override
    public Review update(Review review) {
        return repository.save(review);
    }

    @Override
    public boolean delete(String reviewId) {
        repository.deleteById(reviewId);
        return true;
    }

    @Override
    public List<Review> findByStoreId(String storeId) {
        return repository.findByStore_StoreId(storeId);
    }

    @Override
    public List<Review> getAll() {
        return repository.findAll();
    }
}
