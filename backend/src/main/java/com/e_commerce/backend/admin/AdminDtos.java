package com.e_commerce.backend.admin;

import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.order.OrderStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {}

    public record DailySales(LocalDate date, BigDecimal revenue, long orders) {}

    public record Dashboard(BigDecimal revenue, long orders, long customers, BigDecimal averageOrderValue,
                            long activeDeals, List<DailySales> last14Days, Map<OrderStatus, Long> ordersByStatus,
                            List<ProductSummary> topSellers, List<ProductSummary> lowStock) {}

    /** Create/update payload for products. */
    public record ProductForm(@NotBlank(message = "Title is required") @Size(max = 255) String title,
                              @Size(max = 4000) String description,
                              @Size(max = 100) String brand,
                              @Size(max = 64) String sku,
                              @NotNull(message = "Choose a category") Long categoryId,
                              @NotNull @DecimalMin(value = "0.01", message = "Price must be greater than 0") BigDecimal price,
                              @DecimalMin("0.00") BigDecimal listPrice,
                              @Min(0) @Max(90) Integer dealPercent,
                              Instant dealEndsAt,
                              @NotNull @Min(value = 0, message = "Stock cannot be negative") Integer stock,
                              @Size(max = 500) String thumbnail,
                              List<@Size(max = 500) String> images,
                              List<@Size(max = 500) String> highlights,
                              Double weight, String dimensions, String warranty, String shippingInfo, String returnPolicy,
                              Boolean active) {}

    /** Full product record for the admin edit form. */
    public record AdminProduct(Long id, String title, String description, String brand, String sku, Long categoryId,
                               String categoryName, BigDecimal price, BigDecimal listPrice, Integer dealPercent,
                               Instant dealEndsAt, int stock, int soldCount, double rating, int reviewCount,
                               String thumbnail, List<String> images, List<String> highlights, Double weight,
                               String dimensions, String warranty, String shippingInfo, String returnPolicy,
                               boolean active, Instant createdAt) {}

    public record StatusChange(@NotNull OrderStatus status) {}

    public record RoleChange(@NotNull com.e_commerce.backend.user.Role role) {}

    public record AdminUser(Long id, String email, String fullName, com.e_commerce.backend.user.Role role,
                            boolean wheelSpun, long orders, Instant createdAt) {}
}
