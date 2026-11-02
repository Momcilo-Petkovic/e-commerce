package com.e_commerce.backend.admin;

import com.e_commerce.backend.admin.AdminDtos.*;
import com.e_commerce.backend.catalog.Category;
import com.e_commerce.backend.catalog.CategoryRepository;
import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.catalog.ProductRepository;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.common.Money;
import com.e_commerce.backend.common.PageResponse;
import com.e_commerce.backend.order.CustomerOrder;
import com.e_commerce.backend.order.OrderDtos.OrderDto;
import com.e_commerce.backend.order.OrderRepository;
import com.e_commerce.backend.order.OrderStatus;
import com.e_commerce.backend.review.ReviewDto;
import com.e_commerce.backend.review.ReviewRepository;
import com.e_commerce.backend.user.Role;
import com.e_commerce.backend.user.User;
import com.e_commerce.backend.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

/** Back-office operations: dashboard metrics, catalogue management, order and user administration. */
@Service
@Transactional
public class AdminService {

    /** Orders that do not count towards revenue. */
    private static final Set<OrderStatus> NON_REVENUE = EnumSet.of(OrderStatus.CANCELLED, OrderStatus.RETURNED);

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final OrderRepository orders;
    private final UserRepository users;
    private final ReviewRepository reviews;

    public AdminService(ProductRepository products, CategoryRepository categories, OrderRepository orders,
                        UserRepository users, ReviewRepository reviews) {
        this.products = products;
        this.categories = categories;
        this.orders = orders;
        this.users = users;
        this.reviews = reviews;
    }

    @Transactional(readOnly = true)
    public Dashboard dashboard() {
        BigDecimal revenue = Money.round(orders.sumRevenue(NON_REVENUE));
        long orderCount = orders.countValid(NON_REVENUE);
        BigDecimal aov = orderCount == 0 ? Money.of(0) : revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP);

        // Revenue per day for the last 14 days (in the server's time zone), including empty days.
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate first = today.minusDays(13);
        Map<LocalDate, BigDecimal> revenueByDay = new TreeMap<>();
        Map<LocalDate, Long> ordersByDay = new HashMap<>();
        for (LocalDate d = first; !d.isAfter(today); d = d.plusDays(1)) {
            revenueByDay.put(d, BigDecimal.ZERO);
        }
        for (CustomerOrder o : orders.findSince(first.atStartOfDay(zone).toInstant())) {
            if (NON_REVENUE.contains(o.getStatus())) continue;
            LocalDate day = LocalDate.ofInstant(o.getCreatedAt(), zone);
            revenueByDay.merge(day, o.getTotal(), BigDecimal::add);
            ordersByDay.merge(day, 1L, Long::sum);
        }
        List<DailySales> daily = revenueByDay.entrySet().stream()
                .map(e -> new DailySales(e.getKey(), Money.round(e.getValue()), ordersByDay.getOrDefault(e.getKey(), 0L)))
                .toList();

        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (Object[] row : orders.countByStatus()) {
            byStatus.put((OrderStatus) row[0], ((Number) row[1]).longValue());
        }

        return new Dashboard(revenue, orderCount, users.countByRole(Role.CUSTOMER), aov,
                products.countActiveDeals(Instant.now()), daily, byStatus,
                products.findBestSellers(PageRequest.of(0, 5)).stream().map(ProductSummary::from).toList(),
                products.findLowStock(10, PageRequest.of(0, 8)).stream().map(ProductSummary::from).toList());
    }

    // ---------------------------------------------------------------- products

    @Transactional(readOnly = true)
    public AdminProduct getProduct(Long id) {
        return toAdmin(products.findById(id).orElseThrow(() -> ApiException.notFound("Product")));
    }

    public AdminProduct createProduct(ProductForm form) {
        Product p = new Product();
        apply(p, form);
        return toAdmin(products.save(p));
    }

    public AdminProduct updateProduct(Long id, ProductForm form) {
        Product p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
        apply(p, form);
        return toAdmin(p);
    }

    /** Products are archived rather than deleted so existing orders keep their references. */
    public void archiveProduct(Long id) {
        products.findById(id).orElseThrow(() -> ApiException.notFound("Product")).setActive(false);
    }

    private void apply(Product p, ProductForm f) {
        Category category = categories.findById(f.categoryId()).orElseThrow(() -> ApiException.badRequest("Unknown category"));
        if (f.dealPercent() != null && f.dealPercent() > 0 && f.dealEndsAt() == null) {
            throw ApiException.badRequest("Set an end date for the deal");
        }
        p.setTitle(f.title().trim());
        p.setDescription(f.description());
        p.setBrand(blankToNull(f.brand()));
        p.setSku(blankToNull(f.sku()));
        p.setCategory(category);
        p.setPrice(Money.round(f.price()));
        p.setListPrice(f.listPrice() == null || f.listPrice().signum() == 0 ? null : Money.round(f.listPrice()));
        boolean hasDeal = f.dealPercent() != null && f.dealPercent() > 0;
        p.setDealPercent(hasDeal ? f.dealPercent() : null);
        p.setDealEndsAt(hasDeal ? f.dealEndsAt() : null);
        p.setStock(f.stock());
        List<String> images = f.images() == null ? List.of() : f.images().stream().filter(s -> s != null && !s.isBlank()).map(String::trim).toList();
        p.setImages(new ArrayList<>(images));
        String thumb = blankToNull(f.thumbnail());
        p.setThumbnail(thumb != null ? thumb : images.isEmpty() ? null : images.getFirst());
        p.setHighlights(new ArrayList<>(f.highlights() == null ? List.of()
                : f.highlights().stream().filter(s -> s != null && !s.isBlank()).map(String::trim).toList()));
        p.setWeight(f.weight());
        p.setDimensions(blankToNull(f.dimensions()));
        p.setWarranty(blankToNull(f.warranty()));
        p.setShippingInfo(blankToNull(f.shippingInfo()));
        p.setReturnPolicy(blankToNull(f.returnPolicy()));
        if (f.active() != null) {
            p.setActive(f.active());
        }
    }

    private static AdminProduct toAdmin(Product p) {
        return new AdminProduct(p.getId(), p.getTitle(), p.getDescription(), p.getBrand(), p.getSku(),
                p.getCategory().getId(), p.getCategory().getName(), p.getPrice(), p.getListPrice(), p.getDealPercent(),
                p.getDealEndsAt(), p.getStock(), p.getSoldCount(), p.getRating(), p.getReviewCount(), p.getThumbnail(),
                List.copyOf(p.getImages()), List.copyOf(p.getHighlights()), p.getWeight(), p.getDimensions(),
                p.getWarranty(), p.getShippingInfo(), p.getReturnPolicy(), p.isActive(), p.getCreatedAt());
    }

    // ---------------------------------------------------------------- orders

    @Transactional(readOnly = true)
    public PageResponse<OrderDto> orders(OrderStatus status, String q, int page) {
        String query = q == null || q.isBlank() ? null : q.trim();
        return PageResponse.of(orders.search(status, query, PageRequest.of(Math.max(page, 0), 20)), OrderDto::from);
    }

    public OrderDto changeStatus(String orderNumber, OrderStatus status) {
        CustomerOrder order = orders.findByOrderNumber(orderNumber).orElseThrow(() -> ApiException.notFound("Order"));
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("Cancelled orders cannot be changed");
        }
        if (status == OrderStatus.CANCELLED) {
            order.changeStatus(OrderStatus.CANCELLED);
            order.getItems().forEach(i -> i.getProduct().setStock(i.getProduct().getStock() + i.getQuantity()));
        } else {
            order.changeStatus(status);
        }
        return OrderDto.from(order);
    }

    // ---------------------------------------------------------------- users & reviews

    @Transactional(readOnly = true)
    public PageResponse<AdminUser> users(String q, int page) {
        String query = q == null ? "" : q.trim();
        var result = users.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(query, query,
                PageRequest.of(Math.max(page, 0), 20, Sort.by(Sort.Order.desc("createdAt"))));
        return PageResponse.of(result, u -> new AdminUser(u.getId(), u.getEmail(), u.getFullName(), u.getRole(),
                u.isWheelSpun(), orders.countByUserId(u.getId()), u.getCreatedAt()));
    }

    public void changeRole(Long userId, Long actingAdminId, Role role) {
        if (userId.equals(actingAdminId) && role != Role.ADMIN) {
            throw ApiException.badRequest("You cannot remove your own admin access");
        }
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        user.setRole(role);
    }

    /** Gives a customer another chance on the Wheel of Fortune. */
    public void resetSpin(Long userId) {
        users.findById(userId).orElseThrow(() -> ApiException.notFound("User")).setWheelSpun(false);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> reviews(int page) {
        return PageResponse.of(reviews.findAllWithProduct(PageRequest.of(Math.max(page, 0), 20)), r -> ReviewDto.from(r, null));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
