package com.e_commerce.backend.cart;

import com.e_commerce.backend.cart.CartService.CartView;
import com.e_commerce.backend.cart.CartService.GuestLine;
import com.e_commerce.backend.security.AuthUser;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    public record AddRequest(@NotNull Long productId, @Min(1) int quantity) {}

    public record UpdateRequest(Integer quantity, Boolean savedForLater) {}

    private final CartService cart;

    public CartController(CartService cart) {
        this.cart = cart;
    }

    @GetMapping
    public CartView get(@AuthenticationPrincipal AuthUser me) {
        return cart.view(me.id());
    }

    @PostMapping
    public CartView add(@AuthenticationPrincipal AuthUser me, @RequestBody AddRequest req) {
        return cart.add(me.id(), req.productId(), req.quantity());
    }

    @PatchMapping("/{productId}")
    public CartView update(@AuthenticationPrincipal AuthUser me, @PathVariable Long productId, @RequestBody UpdateRequest req) {
        return cart.update(me.id(), productId, req.quantity(), req.savedForLater());
    }

    @DeleteMapping("/{productId}")
    public CartView remove(@AuthenticationPrincipal AuthUser me, @PathVariable Long productId) {
        return cart.remove(me.id(), productId);
    }

    @PostMapping("/merge")
    public CartView merge(@AuthenticationPrincipal AuthUser me, @RequestBody List<GuestLine> lines) {
        return cart.merge(me.id(), lines);
    }
}
