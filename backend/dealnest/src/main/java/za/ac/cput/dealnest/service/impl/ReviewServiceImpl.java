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
        // The detailed read, not findById: the store reference below is a lazy proxy
        // and the rating recalculation needs its id off a detached entity.
        Review existing = repository.findDetailedById(reviewId).orElse(null);
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
        //
        // The aggregate arrives as a one-row list (see IReviewRepository#summariseForStore
        // for why it is not a bare array), and an aggregate over no rows still yields
        // one row of zeros, so the empty case is only a guard against a store that has
        // no reviews row to select from at all.
        List<Object[]> summary = repository.summariseForStore(store.getStoreId());
        int count = 0;
        double average = 0.0;
        if (!summary.isEmpty()) {
            Object[] row = summary.get(0);
            count = ((Number) row[0]).intValue();
            average = row[1] == null ? 0.0 : ((Number) row[1]).doubleValue();
        }
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
