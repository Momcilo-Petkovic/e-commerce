package com.e_commerce.backend.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Demo-only stand-in for a warehouse/carrier integration: moves orders along the delivery
 * timeline automatically so order tracking can be seen in action.
 * Disable with {@code app.fulfilment.simulate=false} to manage statuses from the admin panel only.
 */
@Component
public class OrderFulfilmentSimulator {

    private static final Logger log = LoggerFactory.getLogger(OrderFulfilmentSimulator.class);

    /** How long an order stays in each status before advancing. */
    private static final Map<OrderStatus, Duration> STEP = Map.of(
            OrderStatus.PLACED, Duration.ofMinutes(2),
            OrderStatus.PROCESSING, Duration.ofMinutes(8),
            OrderStatus.SHIPPED, Duration.ofMinutes(20),
            OrderStatus.OUT_FOR_DELIVERY, Duration.ofMinutes(30),
            OrderStatus.RETURN_REQUESTED, Duration.ofMinutes(30));

    private final OrderRepository orders;
    private final boolean enabled;

    public OrderFulfilmentSimulator(OrderRepository orders, @Value("${app.fulfilment.simulate:true}") boolean enabled) {
        this.orders = orders;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void advanceOrders() {
        if (!enabled) {
            return;
        }
        Instant now = Instant.now();
        List<CustomerOrder> inFlight = orders.findByStatusIn(STEP.keySet());
        int advanced = 0;
        for (CustomerOrder order : inFlight) {
            Duration step = STEP.get(order.getStatus());
            if (step != null && order.getStatusUpdatedAt().plus(step).isBefore(now) && order.getStatus().next() != null) {
                order.changeStatus(order.getStatus().next());
                advanced++;
            }
        }
        if (advanced > 0) {
            log.info("Fulfilment simulator advanced {} order(s)", advanced);
        }
    }
}
