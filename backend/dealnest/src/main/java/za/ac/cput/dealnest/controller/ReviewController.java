package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Review;
import za.ac.cput.dealnest.service.IReviewService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@CrossOrigin(origins = "http://localhost:3000")
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
        return reviewService.update(review);
    }

    @DeleteMapping("/delete/{reviewId}")
    public boolean delete(@PathVariable String reviewId) {
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
}
