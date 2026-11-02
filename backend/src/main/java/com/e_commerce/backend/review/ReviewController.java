package com.e_commerce.backend.review;

import com.e_commerce.backend.common.PageResponse;
import com.e_commerce.backend.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ReviewController {

    public record ReviewRequest(@Min(value = 1, message = "Choose a star rating") @Max(5) int rating,
                                @Size(max = 120, message = "Keep the headline under 120 characters") String title,
                                @Size(max = 4000, message = "Keep your review under 4000 characters") String comment) {}

    private final ReviewService reviews;

    public ReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    /** Public; the principal is only used to flag the caller's own review. */
    @GetMapping("/products/{productId}/reviews")
    public PageResponse<ReviewDto> list(@PathVariable Long productId,
                                        @RequestParam(defaultValue = "recent") String sort,
                                        @RequestParam(required = false) Integer stars,
                                        @RequestParam(defaultValue = "0") int page,
                                        @AuthenticationPrincipal AuthUser me) {
        return reviews.list(productId, sort, stars, page, me == null ? null : me.id());
    }

    @PostMapping("/reviews/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@AuthenticationPrincipal AuthUser me, @PathVariable Long productId,
                            @Valid @RequestBody ReviewRequest req) {
        return reviews.create(me.id(), productId, req.rating(), req.title(), req.comment());
    }

    @DeleteMapping("/reviews/id/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser me, @PathVariable Long reviewId) {
        reviews.delete(reviewId, me.id(), me.isAdmin());
    }
}
