package com.e_commerce.backend.wishlist;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.catalog.ProductRepository;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.user.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@Transactional
public class WishlistController {

    public record WishlistEntry(ProductSummary product, Instant addedAt) {}

    private final WishlistRepository wishlist;
    private final ProductRepository products;
    private final UserRepository users;

    public WishlistController(WishlistRepository wishlist, ProductRepository products, UserRepository users) {
        this.wishlist = wishlist;
        this.products = products;
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<WishlistEntry> list(@AuthenticationPrincipal AuthUser me) {
        return wishlist.findByUserWithProduct(me.id()).stream()
                .map(w -> new WishlistEntry(ProductSummary.from(w.getProduct()), w.getAddedAt()))
                .toList();
    }

    @PostMapping("/{productId}")
    public List<WishlistEntry> add(@AuthenticationPrincipal AuthUser me, @PathVariable Long productId) {
        if (wishlist.findByUserIdAndProductId(me.id(), productId).isEmpty()) {
            Product product = products.findById(productId).filter(Product::isActive)
                    .orElseThrow(() -> ApiException.notFound("Product"));
            wishlist.save(new WishlistItem(users.getReferenceById(me.id()), product));
        }
        return list(me);
    }

    @DeleteMapping("/{productId}")
    public List<WishlistEntry> remove(@AuthenticationPrincipal AuthUser me, @PathVariable Long productId) {
        wishlist.findByUserIdAndProductId(me.id(), productId).ifPresent(wishlist::delete);
        wishlist.flush();
        return list(me);
    }
}
