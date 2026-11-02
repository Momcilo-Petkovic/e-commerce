package com.e_commerce.backend.wishlist;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** A product on the customer's wish list ("Your Lists"). */
@Entity
@Table(name = "wishlist_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"}))
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    @Column(nullable = false)
    private Instant addedAt = Instant.now();

    protected WishlistItem() {}

    public WishlistItem(User user, Product product) {
        this.user = user;
        this.product = product;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public Instant getAddedAt() { return addedAt; }
}
