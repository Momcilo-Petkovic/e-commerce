package com.e_commerce.backend.order;

import com.e_commerce.backend.order.OrderDtos.*;
import com.e_commerce.backend.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final CheckoutService checkout;
    private final OrderService orders;

    public OrderController(CheckoutService checkout, OrderService orders) {
        this.checkout = checkout;
        this.orders = orders;
    }

    /** Live price breakdown for the checkout page. */
    @PostMapping("/checkout/quote")
    public Quote quote(@AuthenticationPrincipal AuthUser me, @RequestBody QuoteRequest req) {
        return checkout.quote(me.id(), req);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto place(@AuthenticationPrincipal AuthUser me, @RequestBody PlaceOrderRequest req) {
        return checkout.placeOrder(me.id(), req);
    }

    @GetMapping("/orders")
    public List<OrderDto> history(@AuthenticationPrincipal AuthUser me, @RequestParam(defaultValue = "all") String period) {
        return orders.history(me.id(), period);
    }

    @GetMapping("/orders/{orderNumber}")
    public OrderDto get(@AuthenticationPrincipal AuthUser me, @PathVariable String orderNumber) {
        return orders.get(me.id(), orderNumber);
    }

    @PostMapping("/orders/{orderNumber}/cancel")
    public OrderDto cancel(@AuthenticationPrincipal AuthUser me, @PathVariable String orderNumber) {
        return orders.cancel(me.id(), orderNumber);
    }

    @PostMapping("/orders/{orderNumber}/return")
    public OrderDto requestReturn(@AuthenticationPrincipal AuthUser me, @PathVariable String orderNumber) {
        return orders.requestReturn(me.id(), orderNumber);
    }
}
