package com.e_commerce.backend.cart;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** A line in a customer's cart. Items can be moved to "Saved for later" without leaving the cart. */
@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"}))
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private boolean savedForLater;

    @Column(nullable = false)
    private Instant addedAt = Instant.now();

    protected CartItem() {}

    public CartItem(User user, Product product, int quantity) {
        this.user = user;
        this.product = product;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public boolean isSavedForLater() { return savedForLater; }
    public void setSavedForLater(boolean savedForLater) { this.savedForLater = savedForLater; }
    public Instant getAddedAt() { return addedAt; }
}
