package com.e_commerce.backend.order;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.order.OrderDtos.OrderDto;
import com.e_commerce.backend.wheel.RewardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/** Customer-facing order history, cancellation and returns. */
@Service
@Transactional
public class OrderService {

    private final OrderRepository orders;
    private final RewardRepository rewards;

    public OrderService(OrderRepository orders, RewardRepository rewards) {
        this.orders = orders;
        this.rewards = rewards;
    }

    /** @param period one of: 30d, 3m, year (current calendar year), all */
    @Transactional(readOnly = true)
    public List<OrderDto> history(Long userId, String period) {
        Instant since = switch (period == null ? "all" : period) {
            case "30d" -> Instant.now().minus(Duration.ofDays(30));
            case "3m" -> Instant.now().minus(Duration.ofDays(91));
            case "year" -> LocalDate.now().withDayOfYear(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            default -> Instant.EPOCH;
        };
        return orders.findByUserSince(userId, since).stream().map(OrderDto::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderDto get(Long userId, String orderNumber) {
        return OrderDto.from(owned(userId, orderNumber));
    }

    public OrderDto cancel(Long userId, String orderNumber) {
        CustomerOrder order = owned(userId, orderNumber);
        if (!order.getStatus().isCancellable()) {
            throw ApiException.badRequest("This order has already shipped and can no longer be cancelled");
        }
        cancelAndRestock(order);
        return OrderDto.from(order);
    }

    public OrderDto requestReturn(Long userId, String orderNumber) {
        CustomerOrder order = owned(userId, orderNumber);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw ApiException.badRequest("Only delivered orders can be returned");
        }
        order.changeStatus(OrderStatus.RETURN_REQUESTED);
        return OrderDto.from(order);
    }

    /** Puts items back in stock and gives back any wheel reward used on the order. */
    void cancelAndRestock(CustomerOrder order) {
        order.changeStatus(OrderStatus.CANCELLED);
        order.getItems().forEach(item -> {
            item.getProduct().setStock(item.getProduct().getStock() + item.getQuantity());
            item.getProduct().setSoldCount(Math.max(0, item.getProduct().getSoldCount() - item.getQuantity()));
        });
        rewards.findByUsedOnOrder(order.getOrderNumber()).ifPresent(r -> r.release());
    }

    private CustomerOrder owned(Long userId, String orderNumber) {
        return orders.findByOrderNumber(orderNumber)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Order"));
    }
}
