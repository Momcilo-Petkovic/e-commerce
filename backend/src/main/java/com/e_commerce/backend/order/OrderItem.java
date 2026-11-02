package com.e_commerce.backend.order;

import com.e_commerce.backend.catalog.Product;
import jakarta.persistence.*;

import java.math.BigDecimal;

/** An order line. Title, image and price are copied from the product at purchase time. */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    @Column(nullable = false)
    private String title;

    private String thumbnail;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    /** Reward discount applied to this line (0 if none). */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    protected OrderItem() {}

    public OrderItem(Product product, BigDecimal unitPrice, int quantity) {
        this.product = product;
        this.title = product.getTitle();
        this.thumbnail = product.getThumbnail();
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() { return id; }
    public CustomerOrder getOrder() { return order; }
    void setOrder(CustomerOrder order) { this.order = order; }
    public Product getProduct() { return product; }
    public String getTitle() { return title; }
    public String getThumbnail() { return thumbnail; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
}
