package com.e_commerce.backend.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Read models for the catalogue API. Entities are never serialized directly. */
public final class ProductDtos {

    private ProductDtos() {}

    /** Compact product card used in grids, carousels, cart and wishlist. */
    public record ProductSummary(Long id, String title, String brand, String thumbnail,
                                 BigDecimal price, BigDecimal referencePrice,
                                 Integer dealPercent, Instant dealEndsAt,
                                 double rating, int reviewCount, int stock, int soldCount,
                                 String category, String categorySlug, String department, String departmentSlug,
                                 boolean active) {

        public static ProductSummary from(Product p) {
            Category c = p.getCategory();
            boolean deal = p.isDealActive();
            return new ProductSummary(p.getId(), p.getTitle(), p.getBrand(), p.getThumbnail(),
                    p.effectivePrice(), p.referencePrice(),
                    deal ? p.getDealPercent() : null, deal ? p.getDealEndsAt() : null,
                    round1(p.getRating()), p.getReviewCount(), p.getStock(), p.getSoldCount(),
                    c.getName(), c.getSlug(), c.getDepartment(), c.getDepartmentSlug(), p.isActive());
        }
    }

    /** Full product page payload. */
    public record ProductDetail(ProductSummary summary, String description, String sku, List<String> images,
                                List<String> highlights, Double weight, String dimensions, String warranty,
                                String shippingInfo, String returnPolicy, int[] ratingHistogram,
                                List<ProductSummary> related) {}

    public record CategoryDto(Long id, String slug, String name) {
        public static CategoryDto from(Category c) {
            return new CategoryDto(c.getId(), c.getSlug(), c.getName());
        }
    }

    public record DepartmentDto(String slug, String name, List<CategoryDto> categories) {}

    public record Facet(String value, String label, long count) {}

    public record SearchResult(List<ProductSummary> content, int page, int size, long totalElements, int totalPages,
                               List<Facet> brands, List<Facet> departments) {}

    /** A home-page row of products, e.g. "Best Sellers in Electronics". */
    public record Shelf(String title, String link, List<ProductSummary> products) {}

    public record DepartmentTile(String slug, String name, List<ProductSummary> products) {}

    public record HomePage(List<ProductSummary> deals, List<DepartmentTile> departments, List<Shelf> shelves) {}

    static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
