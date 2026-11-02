package com.e_commerce.backend.catalog;

import com.e_commerce.backend.catalog.ProductDtos.Facet;
import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.catalog.ProductDtos.SearchResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Faceted product search built with the JPA Criteria API.
 * <p>
 * Every filter is optional. Price filters and price sorting use the <em>effective</em> price
 * (i.e. taking active deals into account), computed in SQL with a CASE expression.
 */
@Service
public class ProductSearchService {

    public enum Sort { FEATURED, PRICE_ASC, PRICE_DESC, RATING, NEWEST, BEST_SELLING }

    public record Criteria(String q, String department, String category, List<String> brands,
                           BigDecimal minPrice, BigDecimal maxPrice, Double minRating,
                           boolean dealsOnly, boolean inStockOnly, boolean includeInactive, Sort sort, int page, int size) {}

    private final EntityManager em;

    public ProductSearchService(EntityManager em) {
        this.em = em;
    }

    @Transactional(readOnly = true)
    public SearchResult search(Criteria c) {
        Instant now = Instant.now();
        CriteriaBuilder cb = em.getCriteriaBuilder();

        // Page of results
        CriteriaQuery<Product> query = cb.createQuery(Product.class);
        Root<Product> root = query.from(Product.class);
        root.fetch("category");
        query.select(root).where(predicates(cb, root, c, now, true).toArray(Predicate[]::new));
        query.orderBy(order(cb, root, c.sort(), now));
        List<Product> products = em.createQuery(query)
                .setFirstResult(c.page() * c.size())
                .setMaxResults(c.size())
                .getResultList();

        // Total count
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Product> countRoot = countQuery.from(Product.class);
        countQuery.select(cb.count(countRoot)).where(predicates(cb, countRoot, c, now, true).toArray(Predicate[]::new));
        long total = em.createQuery(countQuery).getSingleResult();

        int pages = (int) Math.ceil((double) total / c.size());
        return new SearchResult(products.stream().map(ProductSummary::from).toList(), c.page(), c.size(), total, pages,
                brandFacets(cb, c, now), departmentFacets(cb, c, now));
    }

    /** Brands available for the current query (ignoring the brand filter itself, so users can pick several). */
    private List<Facet> brandFacets(CriteriaBuilder cb, Criteria c, Instant now) {
        CriteriaQuery<Tuple> q = cb.createTupleQuery();
        Root<Product> root = q.from(Product.class);
        Criteria withoutBrand = new Criteria(c.q(), c.department(), c.category(), List.of(), c.minPrice(), c.maxPrice(),
                c.minRating(), c.dealsOnly(), c.inStockOnly(), c.includeInactive(), c.sort(), 0, c.size());
        List<Predicate> where = predicates(cb, root, withoutBrand, now, false);
        where.add(cb.isNotNull(root.get("brand")));
        Expression<Long> count = cb.count(root);
        q.multiselect(root.get("brand"), count).where(where.toArray(Predicate[]::new))
                .groupBy(root.get("brand")).orderBy(cb.desc(count));
        return em.createQuery(q).setMaxResults(25).getResultList().stream()
                .map(t -> new Facet(t.get(0, String.class), t.get(0, String.class), t.get(1, Long.class)))
                .toList();
    }

    private List<Facet> departmentFacets(CriteriaBuilder cb, Criteria c, Instant now) {
        CriteriaQuery<Tuple> q = cb.createTupleQuery();
        Root<Product> root = q.from(Product.class);
        Join<Product, Category> cat = root.join("category");
        Criteria withoutDept = new Criteria(c.q(), null, null, c.brands(), c.minPrice(), c.maxPrice(),
                c.minRating(), c.dealsOnly(), c.inStockOnly(), c.includeInactive(), c.sort(), 0, c.size());
        Expression<Long> count = cb.count(root);
        q.multiselect(cat.get("departmentSlug"), cat.get("department"), count)
                .where(predicates(cb, root, withoutDept, now, true).toArray(Predicate[]::new))
                .groupBy(cat.get("departmentSlug"), cat.get("department"))
                .orderBy(cb.desc(count));
        return em.createQuery(q).getResultList().stream()
                .map(t -> new Facet(t.get(0, String.class), t.get(1, String.class), t.get(2, Long.class)))
                .toList();
    }

    private List<Predicate> predicates(CriteriaBuilder cb, Root<Product> root, Criteria c, Instant now, boolean includeBrand) {
        List<Predicate> where = new ArrayList<>();
        Path<Category> category = root.get("category");

        if (!c.includeInactive()) {
            where.add(cb.isTrue(root.get("active")));
        }
        if (c.q() != null && !c.q().isBlank()) {
            // Every word must appear in the title, brand, category or description.
            for (String word : c.q().trim().toLowerCase(Locale.ROOT).split("\\s+")) {
                String like = "%" + word.replace("%", "").replace("_", "") + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("brand")), like),
                        cb.like(cb.lower(category.get("name")), like),
                        cb.like(cb.lower(root.get("description")), like)));
            }
        }
        if (c.department() != null && !c.department().isBlank()) {
            where.add(cb.equal(category.get("departmentSlug"), c.department()));
        }
        if (c.category() != null && !c.category().isBlank()) {
            where.add(cb.equal(category.get("slug"), c.category()));
        }
        if (includeBrand && c.brands() != null && !c.brands().isEmpty()) {
            where.add(root.get("brand").in(c.brands()));
        }
        Expression<Number> price = effectivePrice(cb, root, now);
        if (c.minPrice() != null) {
            where.add(cb.ge(price, c.minPrice()));
        }
        if (c.maxPrice() != null) {
            where.add(cb.le(price, c.maxPrice()));
        }
        if (c.minRating() != null) {
            where.add(cb.ge(root.get("rating"), c.minRating()));
        }
        if (c.dealsOnly()) {
            where.add(dealActive(cb, root, now));
        }
        if (c.inStockOnly()) {
            where.add(cb.gt(root.get("stock"), 0));
        }
        return where;
    }

    private Predicate dealActive(CriteriaBuilder cb, Root<Product> root, Instant now) {
        return cb.and(cb.isNotNull(root.get("dealPercent")),
                cb.gt(root.get("dealPercent"), 0),
                cb.greaterThan(root.<Instant>get("dealEndsAt"), now));
    }

    /** SQL equivalent of {@link Product#effectivePrice()}. */
    private Expression<Number> effectivePrice(CriteriaBuilder cb, Root<Product> root, Instant now) {
        Expression<BigDecimal> price = root.get("price");
        Expression<Integer> percent = root.get("dealPercent");
        Expression<Number> discounted = cb.quot(cb.prod(price, cb.diff(cb.literal(100), percent)), cb.literal(100));
        return cb.<Number>selectCase().when(dealActive(cb, root, now), discounted).otherwise(price);
    }

    private List<Order> order(CriteriaBuilder cb, Root<Product> root, Sort sort, Instant now) {
        Sort s = sort == null ? Sort.FEATURED : sort;
        return switch (s) {
            case PRICE_ASC -> List.of(cb.asc(effectivePrice(cb, root, now)), cb.asc(root.get("id")));
            case PRICE_DESC -> List.of(cb.desc(effectivePrice(cb, root, now)), cb.asc(root.get("id")));
            case RATING -> List.of(cb.desc(root.get("rating")), cb.desc(root.get("reviewCount")), cb.asc(root.get("id")));
            case NEWEST -> List.of(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
            case BEST_SELLING -> List.of(cb.desc(root.get("soldCount")), cb.asc(root.get("id")));
            case FEATURED -> List.of(cb.desc(root.get("soldCount")), cb.desc(root.get("rating")), cb.asc(root.get("id")));
        };
    }
}
