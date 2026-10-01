package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.security.SecurityUtil;
import za.ac.cput.dealnest.service.IReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class ReviewController {

    private final IReviewService reviewService;

    @Autowired
    public ReviewController(IReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/create")
    public Review create(@RequestBody Review review) {
        return reviewService.create(review);
    }

    @GetMapping("/read/{reviewId}")
    public Review read(@PathVariable String reviewId) {
        return reviewService.read(reviewId);
    }

    @PutMapping("/update/{reviewId}")
    public Review update(@PathVariable String reviewId,@RequestBody Review review) {
        Review existing = reviewService.read(reviewId);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found.");
        }
        requireOwnership(existing);
        // Drive the update off the path id and the persisted store, so a caller cannot
        // rewrite the rating on one review and move the row onto a different store.
        review.setReviewID(reviewId);
        review.setStore(existing.getStore());
        review.setUser(existing.getUser());
        review.setCreatedAt(existing.getCreatedAt());
        return reviewService.update(review);
    }

    @DeleteMapping("/delete/{reviewId}")
    public boolean delete(@PathVariable String reviewId) {
        Review existing = reviewService.read(reviewId);
        if (existing == null) return false;
        requireOwnership(existing);
        return reviewService.delete(reviewId);
    }

    @GetMapping("/findByStoreId/{storeId}")
    public List<Review> findByStoreId(@PathVariable String storeId) {
        return reviewService.findByStoreId(storeId);
    }

    @GetMapping("/getAll")
    public List<Review> getAll() {
        return reviewService.getAll();
    }

    /**
     * A review may only be edited or deleted by the shopper who wrote it. An admin may
     * do either to anyone's, which is what the moderation screen in the admin console
     * relies on.
     */
    private void requireOwnership(Review review) {
        if (SecurityUtil.isAdmin()) return;
        if (review.getUser() == null
                || !review.getUser().getUserID().equals(SecurityUtil.currentUserId())) {
            throw new AccessDeniedException("You can only change your own review.");
        }
    }
}
