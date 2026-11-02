package com.e_commerce.backend.catalog;

import com.e_commerce.backend.catalog.ProductDtos.*;
import com.e_commerce.backend.catalog.ProductSearchService.Sort;
import com.e_commerce.backend.common.ApiException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

/** Public catalogue endpoints: browse, search, product pages and the home page. */
@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalog;
    private final ProductSearchService search;

    public CatalogController(CatalogService catalog, ProductSearchService search) {
        this.catalog = catalog;
        this.search = search;
    }

    @GetMapping("/home")
    public HomePage home() {
        return catalog.getHomePage();
    }

    @GetMapping("/categories")
    public List<DepartmentDto> departments() {
        return catalog.getDepartments();
    }

    @GetMapping("/products")
    public SearchResult search(@RequestParam(required = false) String q,
                               @RequestParam(required = false) String department,
                               @RequestParam(required = false) String category,
                               @RequestParam(required = false) List<String> brand,
                               @RequestParam(required = false) BigDecimal minPrice,
                               @RequestParam(required = false) BigDecimal maxPrice,
                               @RequestParam(required = false) Double minRating,
                               @RequestParam(defaultValue = "false") boolean deals,
                               @RequestParam(defaultValue = "false") boolean inStock,
                               @RequestParam(defaultValue = "FEATURED") Sort sort,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "24") int size) {
        int safeSize = Math.clamp(size, 1, 60);
        return search.search(new ProductSearchService.Criteria(q, department, category, brand, minPrice, maxPrice,
                minRating, deals, inStock, false, sort, Math.max(page, 0), safeSize));
    }

    @GetMapping("/products/{id}")
    public ProductDetail product(@PathVariable Long id) {
        return catalog.getProduct(id);
    }

    /** Batch lookup used for "Your browsing history" (ids come from the browser's local storage). */
    @GetMapping("/products/by-ids")
    public List<ProductSummary> byIds(@RequestParam String ids) {
        try {
            List<Long> list = Arrays.stream(ids.split(",")).filter(s -> !s.isBlank()).limit(50).map(Long::valueOf).toList();
            return list.isEmpty() ? List.of() : catalog.getByIds(list);
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("Invalid product ids");
        }
    }

    @GetMapping("/products/suggest")
    public List<String> suggest(@RequestParam String q) {
        return catalog.suggest(q);
    }

    @GetMapping("/products/deals")
    public List<ProductSummary> deals(@RequestParam(required = false) String department) {
        return catalog.getDeals(department, 60);
    }
}
