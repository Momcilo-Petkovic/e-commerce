package com.e_commerce.backend.review;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductRepository;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.common.PageResponse;
import com.e_commerce.backend.order.OrderItemRepository;
import com.e_commerce.backend.user.User;
import com.e_commerce.backend.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviews;
    private final ProductRepository products;
    private final UserRepository users;
    private final OrderItemRepository orderItems;

    public ReviewService(ReviewRepository reviews, ProductRepository products, UserRepository users, OrderItemRepository orderItems) {
        this.reviews = reviews;
        this.products = products;
        this.users = users;
        this.orderItems = orderItems;
    }

    /**
     * @param sort  recent | top (highest rating first) | critical (lowest rating first)
     * @param stars optional filter on an exact star rating
     */
    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> list(Long productId, String sort, Integer stars, int page, Long currentUserId) {
        Sort order = switch (sort == null ? "recent" : sort) {
            case "top" -> Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("createdAt"));
            case "critical" -> Sort.by(Sort.Order.asc("rating"), Sort.Order.desc("createdAt"));
            default -> Sort.by(Sort.Order.desc("createdAt"));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), 10, order);
        Page<Review> result = stars == null
                ? reviews.findByProductId(productId, pageable)
                : reviews.findByProductIdAndRating(productId, stars, pageable);
        return PageResponse.of(result, r -> ReviewDto.from(r, currentUserId));
    }

    public ReviewDto create(Long userId, Long productId, int rating, String title, String comment) {
        if (rating < 1 || rating > 5) {
            throw ApiException.badRequest("Choose a star rating between 1 and 5");
        }
        Product product = products.findById(productId).filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Product"));
        if (reviews.existsByProductIdAndUserId(productId, userId)) {
            throw ApiException.conflict("You have already reviewed this product");
        }
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        boolean verified = orderItems.hasPurchased(userId, productId);
        Review review = reviews.save(new Review(product, user, user.getFullName(), rating,
                blankToNull(title), blankToNull(comment), verified, Instant.now()));
        refreshProductRating(product);
        return ReviewDto.from(review, userId);
    }

    /** Deletes a review; customers may delete their own, admins any. */
    public void delete(Long reviewId, Long userId, boolean admin) {
        Review review = reviews.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review"));
        boolean own = review.getUser() != null && review.getUser().getId().equals(userId);
        if (!own && !admin) {
            throw ApiException.notFound("Review");
        }
        Product product = review.getProduct();
        reviews.delete(review);
        reviews.flush();
        refreshProductRating(product);
    }

    /** Keeps the denormalised average rating and review count on the product in sync. */
    void refreshProductRating(Product product) {
        Object[] row = reviews.aggregate(product.getId()).getFirst();
        Number avg = (Number) row[0];
        Number count = (Number) row[1];
        product.setRating(avg == null ? 0 : avg.doubleValue());
        product.setReviewCount(count == null ? 0 : count.intValue());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
