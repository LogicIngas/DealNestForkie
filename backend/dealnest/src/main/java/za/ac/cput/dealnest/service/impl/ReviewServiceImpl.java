package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.repository.IReviewRepository;
import za.ac.cput.dealnest.service.IReviewService;
import za.ac.cput.dealnest.service.IStoreService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;

@Service
public class ReviewServiceImpl implements IReviewService {

    private final IReviewRepository repository;
    private final IStoreService storeService;
    private final IUserService userService;

    public ReviewServiceImpl(IReviewRepository repository, IStoreService storeService, IUserService userService) {
        this.repository = repository;
        this.storeService = storeService;
        this.userService = userService;
    }

    @Override
    public Review create(Review review) {
        Review saved = repository.save(review);
        recalculateStoreRating(saved.getStore());
        if (saved.getUser() != null && saved.getUser().getUserID() != null) {
            userService.addPoints(saved.getUser().getUserID(), 5);
        }
        return saved;
    }

    @Override
    public Review read(String reviewId) {
        return repository.findDetailedById(reviewId).orElse(null);
    }

    @Override
    public Review update(Review review) {
        Review saved = repository.save(review);
        recalculateStoreRating(saved.getStore());
        return saved;
    }

    @Override
    public boolean delete(String reviewId) {
        Review existing = repository.findById(reviewId).orElse(null);
        repository.deleteById(reviewId);
        if (existing != null) {
            recalculateStoreRating(existing.getStore());
        }
        return true;
    }

    private void recalculateStoreRating(Store storeRef) {
        if (storeRef == null) return;
        Store store = storeService.read(storeRef.getStoreId());
        if (store == null) return;
        // Counted and averaged by Postgres. This used to read every review of the
        // store into memory to average them in Java, which also had to walk each
        // review's author and its store's owner.
        Object[] summary = repository.summariseForStore(store.getStoreId());
        int count = ((Number) summary[0]).intValue();
        double average = summary[1] == null ? 0.0 : ((Number) summary[1]).doubleValue();
        store.setTotalReviews(count);
        store.setAverageRating(count == 0 ? null : Math.round(average * 10.0) / 10.0);
        storeService.update(store);
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
