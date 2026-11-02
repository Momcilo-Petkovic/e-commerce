package com.e_commerce.backend.order;

/** Order lifecycle. The first five values form the normal delivery timeline, in order. */
public enum OrderStatus {
    PLACED,
    PROCESSING,
    SHIPPED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURNED;

    public boolean isCancellable() {
        return this == PLACED || this == PROCESSING;
    }

    /** Next step of the normal delivery flow, or null if there is none. */
    public OrderStatus next() {
        return switch (this) {
            case PLACED -> PROCESSING;
            case PROCESSING -> SHIPPED;
            case SHIPPED -> OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> DELIVERED;
            case RETURN_REQUESTED -> RETURNED;
            default -> null;
        };
    }
}
