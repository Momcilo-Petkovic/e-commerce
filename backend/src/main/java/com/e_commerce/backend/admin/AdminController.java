package com.e_commerce.backend.admin;

import com.e_commerce.backend.admin.AdminDtos.*;
import com.e_commerce.backend.catalog.CatalogService;
import com.e_commerce.backend.catalog.ProductDtos.DepartmentDto;
import com.e_commerce.backend.catalog.ProductDtos.SearchResult;
import com.e_commerce.backend.catalog.ProductSearchService;
import com.e_commerce.backend.common.PageResponse;
import com.e_commerce.backend.order.OrderDtos.OrderDto;
import com.e_commerce.backend.order.OrderStatus;
import com.e_commerce.backend.review.ReviewDto;
import com.e_commerce.backend.review.ReviewService;
import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.wheel.WheelDtos.AdminSegmentDto;
import com.e_commerce.backend.wheel.WheelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Back-office API. Access is restricted to ADMIN users in {@code SecurityConfig}. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;
    private final ProductSearchService search;
    private final CatalogService catalog;
    private final ReviewService reviews;
    private final WheelService wheel;

    public AdminController(AdminService admin, ProductSearchService search, CatalogService catalog,
                           ReviewService reviews, WheelService wheel) {
        this.admin = admin;
        this.search = search;
        this.catalog = catalog;
        this.reviews = reviews;
        this.wheel = wheel;
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard() {
        return admin.dashboard();
    }

    @GetMapping("/categories")
    public List<DepartmentDto> categories() {
        return catalog.getDepartments();
    }

    @GetMapping("/products")
    public SearchResult products(@RequestParam(required = false) String q,
                                 @RequestParam(defaultValue = "NEWEST") ProductSearchService.Sort sort,
                                 @RequestParam(defaultValue = "0") int page) {
        return search.search(new ProductSearchService.Criteria(q, null, null, null, null, null, null,
                false, false, true, sort, Math.max(page, 0), 20));
    }

    @GetMapping("/products/{id}")
    public AdminProduct product(@PathVariable Long id) {
        return admin.getProduct(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProduct create(@Valid @RequestBody ProductForm form) {
        return admin.createProduct(form);
    }

    @PutMapping("/products/{id}")
    public AdminProduct update(@PathVariable Long id, @Valid @RequestBody ProductForm form) {
        return admin.updateProduct(id, form);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable Long id) {
        admin.archiveProduct(id);
    }

    @GetMapping("/orders")
    public PageResponse<OrderDto> orders(@RequestParam(required = false) OrderStatus status,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(defaultValue = "0") int page) {
        return admin.orders(status, q, page);
    }

    @PatchMapping("/orders/{orderNumber}/status")
    public OrderDto changeStatus(@PathVariable String orderNumber, @Valid @RequestBody StatusChange req) {
        return admin.changeStatus(orderNumber, req.status());
    }

    @GetMapping("/users")
    public PageResponse<AdminUser> users(@RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page) {
        return admin.users(q, page);
    }

    @PatchMapping("/users/{id}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(@AuthenticationPrincipal AuthUser me, @PathVariable Long id, @Valid @RequestBody RoleChange req) {
        admin.changeRole(id, me.id(), req.role());
    }

    @PostMapping("/users/{id}/reset-spin")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetSpin(@PathVariable Long id) {
        admin.resetSpin(id);
    }

    @GetMapping("/reviews")
    public PageResponse<ReviewDto> reviews(@RequestParam(defaultValue = "0") int page) {
        return admin.reviews(page);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        reviews.delete(id, me.id(), true);
    }

    @GetMapping("/wheel")
    public List<AdminSegmentDto> wheel() {
        return wheel.adminSegments();
    }

    @PutMapping("/wheel")
    public List<AdminSegmentDto> updateWheel(@RequestBody List<AdminSegmentDto> segments) {
        return wheel.replaceSegments(segments);
    }
}
