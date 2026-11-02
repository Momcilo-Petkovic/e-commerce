package com.e_commerce.backend.order;

import java.math.BigDecimal;

/** Delivery speeds offered at checkout. Standard delivery is free above {@link #FREE_STANDARD_THRESHOLD}. */
public enum DeliveryOption {
    STANDARD("Standard delivery", new BigDecimal("5.99"), 5),
    EXPRESS("Express delivery", new BigDecimal("9.99"), 2),
    NEXT_DAY("Next-day delivery", new BigDecimal("14.99"), 1);

    public static final BigDecimal FREE_STANDARD_THRESHOLD = new BigDecimal("35.00");

    private final String label;
    private final BigDecimal price;
    private final int businessDays;

    DeliveryOption(String label, BigDecimal price, int businessDays) {
        this.label = label;
        this.price = price;
        this.businessDays = businessDays;
    }

    public String getLabel() { return label; }
    public int getBusinessDays() { return businessDays; }

    public BigDecimal priceFor(BigDecimal subtotal) {
        if (this == STANDARD && subtotal.compareTo(FREE_STANDARD_THRESHOLD) >= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return price;
    }
}
