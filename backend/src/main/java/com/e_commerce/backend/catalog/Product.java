package com.e_commerce.backend.catalog;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A sellable product.
 * <p>
 * Pricing model:
 * <ul>
 *   <li>{@code price} - the regular selling price.</li>
 *   <li>{@code listPrice} - optional manufacturer price, shown struck-through ("List: $X").</li>
 *   <li>{@code dealPercent}/{@code dealEndsAt} - a time-limited deal; while active the customer pays
 *       {@link #effectivePrice()}.</li>
 * </ul>
 */
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_product_category", columnList = "category_id"),
        @Index(name = "idx_product_brand", columnList = "brand")
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    private String brand;

    private String sku;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(precision = 12, scale = 2)
    private BigDecimal listPrice;

    private Integer dealPercent;

    private Instant dealEndsAt;

    @Column(nullable = false)
    private double rating;

    @Column(nullable = false)
    private int reviewCount;

    @Column(nullable = false)
    private int stock;

    /** Units sold; used for "Best Sellers" ranking. */
    @Column(nullable = false)
    private int soldCount;

    private String thumbnail;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", length = 500)
    private List<String> images = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_highlights", joinColumns = @JoinColumn(name = "product_id"))
    @OrderColumn(name = "position")
    @Column(name = "text", length = 500)
    private List<String> highlights = new ArrayList<>();

    private Double weight;
    private String dimensions;
    private String warranty;
    private String shippingInfo;
    private String returnPolicy;

    /** Inactive products are hidden from the storefront but kept for order history. */
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Product() {}

    public boolean isDealActive() {
        return dealPercent != null && dealPercent > 0 && dealEndsAt != null && dealEndsAt.isAfter(Instant.now());
    }

    /** The price the customer actually pays right now. */
    public BigDecimal effectivePrice() {
        if (!isDealActive()) {
            return price;
        }
        BigDecimal factor = BigDecimal.valueOf(100 - dealPercent).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        return price.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    /** The reference price shown struck-through next to the effective price (null if none). */
    public BigDecimal referencePrice() {
        if (isDealActive()) {
            return price;
        }
        return listPrice != null && listPrice.compareTo(price) > 0 ? listPrice : null;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getListPrice() { return listPrice; }
    public void setListPrice(BigDecimal listPrice) { this.listPrice = listPrice; }
    public Integer getDealPercent() { return dealPercent; }
    public void setDealPercent(Integer dealPercent) { this.dealPercent = dealPercent; }
    public Instant getDealEndsAt() { return dealEndsAt; }
    public void setDealEndsAt(Instant dealEndsAt) { this.dealEndsAt = dealEndsAt; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public int getSoldCount() { return soldCount; }
    public void setSoldCount(int soldCount) { this.soldCount = soldCount; }
    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public List<String> getHighlights() { return highlights; }
    public void setHighlights(List<String> highlights) { this.highlights = highlights; }
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }
    public String getWarranty() { return warranty; }
    public void setWarranty(String warranty) { this.warranty = warranty; }
    public String getShippingInfo() { return shippingInfo; }
    public void setShippingInfo(String shippingInfo) { this.shippingInfo = shippingInfo; }
    public String getReturnPolicy() { return returnPolicy; }
    public void setReturnPolicy(String returnPolicy) { this.returnPolicy = returnPolicy; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
}
