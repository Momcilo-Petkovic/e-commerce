package com.e_commerce.backend.review;

import java.time.Instant;

public record ReviewDto(Long id, Long productId, String productTitle, String authorName, int rating, String title,
                        String comment, boolean verifiedPurchase, boolean mine, Instant createdAt) {

    public static ReviewDto from(Review r, Long currentUserId) {
        boolean mine = currentUserId != null && r.getUser() != null && currentUserId.equals(r.getUser().getId());
        return new ReviewDto(r.getId(), r.getProduct().getId(), r.getProduct().getTitle(), r.getAuthorName(),
                r.getRating(), r.getTitle(), r.getComment(), r.isVerifiedPurchase(), mine, r.getCreatedAt());
    }
}
