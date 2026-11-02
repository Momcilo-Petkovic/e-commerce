package com.e_commerce.backend.config;

import com.e_commerce.backend.address.Address;
import com.e_commerce.backend.address.AddressRepository;
import com.e_commerce.backend.catalog.Category;
import com.e_commerce.backend.catalog.CategoryRepository;
import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductRepository;
import com.e_commerce.backend.common.Money;
import com.e_commerce.backend.review.Review;
import com.e_commerce.backend.review.ReviewRepository;
import com.e_commerce.backend.user.Role;
import com.e_commerce.backend.user.User;
import com.e_commerce.backend.user.UserRepository;
import com.e_commerce.backend.wheel.RewardType;
import com.e_commerce.backend.wheel.WheelSegment;
import com.e_commerce.backend.wheel.WheelSegmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Populates an empty database with demo data on first start:
 * <ul>
 *   <li>the catalogue (194 products from the MIT-licensed DummyJSON dataset, see {@code seed/catalog.json}),</li>
 *   <li>an admin account and a demo customer account,</li>
 *   <li>the default Wheel of Fortune configuration.</li>
 * </ul>
 * Each part is only created if it does not exist yet, so restarting the app never duplicates data.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    record SeedCategory(String slug, String name, String department, String departmentSlug) {}

    record SeedReview(String author, int rating, String comment, String date) {}

    record SeedProduct(String title, String description, String brand, String sku, String category, double price,
                       double discountPercentage, int stock, String thumbnail, List<String> images, List<String> highlights,
                       Double weight, String dimensions, String warranty, String shippingInfo, String returnPolicy,
                       List<SeedReview> reviews) {}

    record SeedCatalog(List<SeedCategory> categories, List<SeedProduct> products) {}

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final AddressRepository addresses;
    private final WheelSegmentRepository wheelSegments;
    private final PasswordEncoder passwordEncoder;
    private final DealManager dealManager;
    private final String adminEmail;
    private final String adminPassword;
    private final String demoEmail;
    private final String demoPassword;

    public DataSeeder(CategoryRepository categories, ProductRepository products, ReviewRepository reviews,
                      UserRepository users, AddressRepository addresses, WheelSegmentRepository wheelSegments,
                      PasswordEncoder passwordEncoder, DealManager dealManager,
                      @Value("${app.seed.admin-email:admin@e-commerce.dev}") String adminEmail,
                      @Value("${app.seed.admin-password:Admin123!}") String adminPassword,
                      @Value("${app.seed.demo-email:demo@e-commerce.dev}") String demoEmail,
                      @Value("${app.seed.demo-password:Demo123!}") String demoPassword) {
        this.categories = categories;
        this.products = products;
        this.reviews = reviews;
        this.users = users;
        this.addresses = addresses;
        this.wheelSegments = wheelSegments;
        this.passwordEncoder = passwordEncoder;
        this.dealManager = dealManager;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.demoEmail = demoEmail;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (categories.count() == 0) {
            seedCatalog();
        }
        if (!users.existsByEmailIgnoreCase(adminEmail)) {
            users.save(new User(adminEmail, passwordEncoder.encode(adminPassword), "Store Admin", Role.ADMIN));
            log.info("Created admin account {}", adminEmail);
        }
        if (!users.existsByEmailIgnoreCase(demoEmail)) {
            User demo = users.save(new User(demoEmail, passwordEncoder.encode(demoPassword), "Demo Customer", Role.CUSTOMER));
            Address home = new Address(demo);
            home.setFullName("Demo Customer");
            home.setLine1("221B Baker Street");
            home.setCity("London");
            home.setPostalCode("NW1 6XE");
            home.setCountry("United Kingdom");
            home.setPhone("+44 20 7946 0000");
            home.setDefaultAddress(true);
            addresses.save(home);
            log.info("Created demo customer account {}", demoEmail);
        }
        if (wheelSegments.count() == 0) {
            seedWheel();
        }
        dealManager.refreshDeals();
    }

    private void seedCatalog() throws IOException {
        SeedCatalog catalog;
        try (InputStream in = new ClassPathResource("seed/catalog.json").getInputStream()) {
            catalog = JsonMapper.builder().build().readValue(in, SeedCatalog.class);
        }

        Map<String, Category> bySlug = new HashMap<>();
        for (SeedCategory c : catalog.categories()) {
            bySlug.put(c.slug(), categories.save(new Category(c.slug(), c.name(), c.department(), c.departmentSlug())));
        }

        // Fixed seed so every fresh install gets the same "best sellers" and arrival dates.
        Random random = new Random(42);
        Instant now = Instant.now();
        for (SeedProduct s : catalog.products()) {
            Product p = new Product();
            p.setTitle(s.title());
            p.setDescription(s.description());
            p.setBrand(s.brand());
            p.setSku(s.sku());
            p.setCategory(bySlug.get(s.category()));
            p.setPrice(Money.of(s.price()));
            // The dataset's discount percentage becomes a manufacturer list price shown struck-through.
            if (s.discountPercentage() >= 5) {
                p.setListPrice(Money.of(s.price() / (1 - s.discountPercentage() / 100)));
            }
            p.setStock(s.stock());
            p.setThumbnail(s.thumbnail());
            p.setImages(new ArrayList<>(s.images()));
            p.setHighlights(new ArrayList<>(s.highlights()));
            p.setWeight(s.weight());
            p.setDimensions(s.dimensions());
            p.setWarranty(s.warranty());
            p.setShippingInfo(s.shippingInfo());
            p.setReturnPolicy(s.returnPolicy());
            p.setSoldCount(random.nextInt(40) + (int) Math.round(Math.pow(random.nextDouble(), 2) * 900));
            products.save(p);
            backdate(p, now.minus(Duration.ofDays(random.nextInt(120))));

            double sum = 0;
            for (SeedReview r : s.reviews()) {
                Instant date = parseOr(r.date(), now);
                reviews.save(new Review(p, null, r.author(), r.rating(), r.comment(), null, true, date));
                sum += r.rating();
            }
            p.setReviewCount(s.reviews().size());
            p.setRating(s.reviews().isEmpty() ? 0 : sum / s.reviews().size());
        }
        log.info("Seeded {} categories and {} products", bySlug.size(), catalog.products().size());
    }

    private void seedWheel() {
        List<WheelSegment> defaults = List.of(
                new WheelSegment("5% OFF", RewardType.PERCENT_OFF, 5, 28, "#0f766e", 0),
                new WheelSegment("FREE DELIVERY", RewardType.FREE_SHIPPING, 0, 18, "#1e293b", 1),
                new WheelSegment("10% OFF", RewardType.PERCENT_OFF, 10, 22, "#0d9488", 2),
                new WheelSegment("50% OFF", RewardType.PERCENT_OFF, 50, 3, "#be123c", 3),
                new WheelSegment("15% OFF", RewardType.PERCENT_OFF, 15, 14, "#334155", 4),
                new WheelSegment("FREE ITEM", RewardType.FREE_ITEM, 0, 1, "#d97706", 5),
                new WheelSegment("20% OFF", RewardType.PERCENT_OFF, 20, 9, "#115e59", 6),
                new WheelSegment("30% OFF", RewardType.PERCENT_OFF, 30, 5, "#475569", 7));
        wheelSegments.saveAll(defaults);
    }

    /** createdAt is not settable through the public API; reflection keeps the entity immutable for normal code. */
    private static void backdate(Product p, Instant createdAt) {
        try {
            var field = Product.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(p, createdAt);
        } catch (ReflectiveOperationException e) {
            // Not critical: products simply keep their real creation time.
        }
    }

    private static Instant parseOr(String value, Instant fallback) {
        try {
            return Instant.parse(value);
        } catch (RuntimeException e) {
            return fallback;
        }
    }
}
