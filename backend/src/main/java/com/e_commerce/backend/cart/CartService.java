package com.e_commerce.backend.cart;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.catalog.ProductRepository;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Shopping cart operations. Quantities are capped by available stock and a per-line maximum. */
@Service
@Transactional
public class CartService {

    public static final int MAX_QUANTITY_PER_LINE = 30;

    public record CartLine(ProductSummary product, int quantity, BigDecimal lineTotal) {}

    public record CartView(List<CartLine> items, List<CartLine> savedForLater, int itemCount, BigDecimal subtotal) {}

    public record GuestLine(Long productId, int quantity) {}

    private final CartItemRepository cartItems;
    private final ProductRepository products;
    private final UserRepository users;

    public CartService(CartItemRepository cartItems, ProductRepository products, UserRepository users) {
        this.cartItems = cartItems;
        this.products = products;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public CartView view(Long userId) {
        List<CartItem> all = cartItems.findByUserWithProduct(userId).stream()
                .filter(ci -> ci.getProduct().isActive())
                .toList();
        List<CartLine> active = all.stream().filter(ci -> !ci.isSavedForLater()).map(CartService::line).toList();
        List<CartLine> saved = all.stream().filter(CartItem::isSavedForLater).map(CartService::line).toList();
        int count = active.stream().mapToInt(CartLine::quantity).sum();
        BigDecimal subtotal = active.stream().map(CartLine::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartView(active, saved, count, subtotal);
    }

    public CartView add(Long userId, Long productId, int quantity) {
        Product product = activeProduct(productId);
        CartItem item = cartItems.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> cartItems.save(new CartItem(users.getReferenceById(userId), product, 0)));
        item.setSavedForLater(false);
        item.setQuantity(clampQuantity(product, item.getQuantity() + Math.max(quantity, 1)));
        return view(userId);
    }

    public CartView update(Long userId, Long productId, Integer quantity, Boolean savedForLater) {
        CartItem item = cartItems.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> ApiException.notFound("Cart item"));
        if (quantity != null) {
            if (quantity <= 0) {
                cartItems.delete(item);
                return view(userId);
            }
            item.setQuantity(clampQuantity(item.getProduct(), quantity));
        }
        if (savedForLater != null) {
            item.setSavedForLater(savedForLater);
        }
        return view(userId);
    }

    public CartView remove(Long userId, Long productId) {
        cartItems.findByUserIdAndProductId(userId, productId).ifPresent(cartItems::delete);
        return view(userId);
    }

    /** Merges a cart built while signed out (stored in the browser) into the account's cart after login. */
    public CartView merge(Long userId, List<GuestLine> lines) {
        for (GuestLine line : lines) {
            products.findById(line.productId()).filter(Product::isActive).ifPresent(p -> {
                CartItem item = cartItems.findByUserIdAndProductId(userId, p.getId())
                        .orElseGet(() -> cartItems.save(new CartItem(users.getReferenceById(userId), p, 0)));
                item.setSavedForLater(false);
                item.setQuantity(clampQuantity(p, Math.max(item.getQuantity(), line.quantity())));
            });
        }
        return view(userId);
    }

    private Product activeProduct(Long productId) {
        Product product = products.findById(productId).filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("Product"));
        if (product.getStock() <= 0) {
            throw ApiException.badRequest("This item is currently unavailable");
        }
        return product;
    }

    private static int clampQuantity(Product p, int requested) {
        int max = Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, p.getStock()));
        return Math.clamp(requested, 1, max);
    }

    private static CartLine line(CartItem ci) {
        ProductSummary summary = ProductSummary.from(ci.getProduct());
        return new CartLine(summary, ci.getQuantity(), summary.price().multiply(BigDecimal.valueOf(ci.getQuantity())));
    }
}
