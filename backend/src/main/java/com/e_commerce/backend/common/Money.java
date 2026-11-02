package com.e_commerce.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Small helpers for currency arithmetic. All prices are stored as BigDecimal with 2 decimals. */
public final class Money {

    private Money() {}

    public static BigDecimal of(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal round(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal percentOf(BigDecimal amount, int percent) {
        return round(amount.multiply(BigDecimal.valueOf(percent)).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }
}
