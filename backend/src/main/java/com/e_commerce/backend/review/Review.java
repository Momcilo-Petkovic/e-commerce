package com.e_commerce.backend.review;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * A customer review. {@code user} is null for imported seed reviews; {@code authorName}
 * is always populated so reviews survive account deletion.
 */
@Entity
@Table(name = "reviews", indexes = @Index(name = "idx_review_product", columnList = "product_id"))
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false)
    private int rating;

    private String title;

    @Column(length = 4000)
    private String comment;

    /** True when the author has an order containing this product. */
    @Column(nullable = false)
    private boolean verifiedPurchase;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Review() {}

    public Review(Product product, User user, String authorName, int rating, String title, String comment,
                  boolean verifiedPurchase, Instant createdAt) {
        this.product = product;
        this.user = user;
        this.authorName = authorName;
        this.rating = rating;
        this.title = title;
        this.comment = comment;
        this.verifiedPurchase = verifiedPurchase;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public User getUser() { return user; }
    public String getAuthorName() { return authorName; }
    public int getRating() { return rating; }
    public String getTitle() { return title; }
    public String getComment() { return comment; }
    public boolean isVerifiedPurchase() { return verifiedPurchase; }
    public Instant getCreatedAt() { return createdAt; }
}
