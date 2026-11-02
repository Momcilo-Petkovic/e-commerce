package com.e_commerce.backend.catalog;

import com.e_commerce.backend.catalog.ProductDtos.*;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.review.ReviewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/** Read-side catalogue operations: product pages, home page shelves, departments, deals, suggestions. */
@Service
@Transactional(readOnly = true)
public class CatalogService {

    /** Order of department tiles and "Popular in ..." rows on the home page. */
    private static final List<String> HOME_DEPARTMENT_ORDER =
            List.of("electronics", "fashion", "home-kitchen", "beauty", "sports", "grocery", "automotive");

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final ReviewRepository reviews;

    public CatalogService(ProductRepository products, CategoryRepository categories, ReviewRepository reviews) {
        this.products = products;
        this.categories = categories;
        this.reviews = reviews;
    }

    public ProductDetail getProduct(Long id) {
        Product p = products.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Product"));

        // histogram[0] = 5-star count ... histogram[4] = 1-star count
        int[] histogram = new int[5];
        for (Object[] row : reviews.countByRating(id)) {
            int stars = ((Number) row[0]).intValue();
            if (stars >= 1 && stars <= 5) {
                histogram[5 - stars] = ((Number) row[1]).intValue();
            }
        }

        List<ProductSummary> related = products.findRelated(p.getCategory().getId(), p.getId(), PageRequest.of(0, 12))
                .stream().map(ProductSummary::from).toList();

        return new ProductDetail(ProductSummary.from(p), p.getDescription(), p.getSku(), List.copyOf(p.getImages()),
                List.copyOf(p.getHighlights()), p.getWeight(), p.getDimensions(), p.getWarranty(), p.getShippingInfo(),
                p.getReturnPolicy(), histogram, related);
    }

    public List<ProductSummary> getByIds(List<Long> ids) {
        Map<Long, Product> byId = new HashMap<>();
        products.findActiveByIds(ids).forEach(p -> byId.put(p.getId(), p));
        // Preserve the order requested by the client (e.g. most recently viewed first).
        return ids.stream().map(byId::get).filter(Objects::nonNull).map(ProductSummary::from).toList();
    }

    public List<DepartmentDto> getDepartments() {
        Map<String, List<Category>> grouped = new LinkedHashMap<>();
        for (Category c : categories.findAllByOrderByDepartmentAscNameAsc()) {
            grouped.computeIfAbsent(c.getDepartmentSlug() + "|" + c.getDepartment(), k -> new ArrayList<>()).add(c);
        }
        return grouped.entrySet().stream().map(e -> {
            String[] key = e.getKey().split("\\|", 2);
            return new DepartmentDto(key[0], key[1], e.getValue().stream().map(CategoryDto::from).toList());
        }).toList();
    }

    public List<ProductSummary> getDeals(String department, int limit) {
        String dept = department == null || department.isBlank() ? null : department;
        return products.findActiveDeals(Instant.now(), dept, PageRequest.of(0, limit))
                .stream().map(ProductSummary::from).toList();
    }

    public List<String> suggest(String q) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        return products.suggestTitles(q.trim(), PageRequest.of(0, 8));
    }

    public HomePage getHomePage() {
        List<ProductSummary> deals = getDeals(null, 16);

        List<DepartmentTile> tiles = new ArrayList<>();
        List<DepartmentDto> departments = new ArrayList<>(getDepartments());
        departments.sort(Comparator.comparingInt(d -> {
            int i = HOME_DEPARTMENT_ORDER.indexOf(d.slug());
            return i < 0 ? Integer.MAX_VALUE : i;
        }));
        for (DepartmentDto d : departments) {
            List<ProductSummary> top = products.findTopInDepartment(d.slug(), PageRequest.of(0, 4))
                    .stream().map(ProductSummary::from).toList();
            if (top.size() == 4) {
                tiles.add(new DepartmentTile(d.slug(), d.name(), top));
            }
        }

        List<Shelf> shelves = new ArrayList<>();
        shelves.add(new Shelf("Best Sellers", "/s?sort=BEST_SELLING", summaries(products.findBestSellers(PageRequest.of(0, 16)))));
        shelves.add(new Shelf("Top rated by customers", "/s?sort=RATING", summaries(products.findTopRated(PageRequest.of(0, 16)))));
        for (DepartmentTile tile : tiles.stream().limit(3).toList()) {
            shelves.add(new Shelf("Popular in " + tile.name(), "/s?department=" + tile.slug(),
                    summaries(products.findTopInDepartment(tile.slug(), PageRequest.of(0, 16)))));
        }
        shelves.add(new Shelf("New arrivals", "/s?sort=NEWEST", summaries(products.findNewest(PageRequest.of(0, 16)))));
        return new HomePage(deals, tiles, shelves);
    }

    private static List<ProductSummary> summaries(List<Product> list) {
        return list.stream().map(ProductSummary::from).toList();
    }
}
