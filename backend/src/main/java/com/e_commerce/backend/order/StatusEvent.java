package com.e_commerce.backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;

/** One entry of an order's tracking history. */
@Embeddable
public class StatusEvent {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private Instant at;

    protected StatusEvent() {}

    public StatusEvent(OrderStatus status, Instant at) {
        this.status = status;
        this.at = at;
    }

    public OrderStatus getStatus() { return status; }
    public Instant getAt() { return at; }
}
