package com.e_commerce.backend.order;

import com.e_commerce.backend.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Simulated card payment processor. No money moves and no card data is stored:
 * only the brand and last four digits are kept on the order.
 * <p>
 * It applies the same checks a real processor would (Luhn checksum, expiry, CVC length)
 * and supports test cards so failure paths can be demonstrated:
 * <ul>
 *   <li>4242 4242 4242 4242 - approved</li>
 *   <li>4000 0000 0000 0002 - declined</li>
 *   <li>4000 0000 0000 9995 - insufficient funds</li>
 * </ul>
 * Any other Luhn-valid number is approved. Swapping this class for a real provider
 * (e.g. Stripe) would not affect the rest of the checkout code.
 */
@Component
public class PaymentGateway {

    public record CardDetails(String number, String holderName, int expMonth, int expYear, String cvc) {}

    public record PaymentResult(String reference, String brand, String last4) {}

    public PaymentResult charge(CardDetails card, BigDecimal amount) {
        String number = card.number() == null ? "" : card.number().replaceAll("[\\s-]", "");
        if (!number.matches("\\d{12,19}") || !passesLuhn(number)) {
            throw paymentError("Your card number is invalid");
        }
        if (card.holderName() == null || card.holderName().isBlank()) {
            throw paymentError("Enter the name on the card");
        }
        if (card.expMonth() < 1 || card.expMonth() > 12) {
            throw paymentError("Your card's expiration month is invalid");
        }
        int year = card.expYear() < 100 ? 2000 + card.expYear() : card.expYear();
        if (YearMonth.of(year, card.expMonth()).isBefore(YearMonth.now())) {
            throw paymentError("Your card has expired");
        }
        String brand = brandOf(number);
        int cvcLength = "American Express".equals(brand) ? 4 : 3;
        if (card.cvc() == null || !card.cvc().matches("\\d{" + cvcLength + "}")) {
            throw paymentError("Your card's security code is invalid");
        }
        switch (number) {
            case "4000000000000002" -> throw paymentError("Your card was declined. Try a different payment method.");
            case "4000000000009995" -> throw paymentError("Your card has insufficient funds.");
            default -> { /* approved */ }
        }
        if (amount.signum() < 0) {
            throw paymentError("Invalid payment amount");
        }
        return new PaymentResult("pay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20),
                brand, number.substring(number.length() - 4));
    }

    static boolean passesLuhn(String number) {
        int sum = 0;
        boolean doubleIt = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int d = number.charAt(i) - '0';
            if (doubleIt) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            doubleIt = !doubleIt;
        }
        return sum % 10 == 0;
    }

    static String brandOf(String number) {
        if (number.startsWith("4")) return "Visa";
        if (number.matches("^(5[1-5]|2[2-7]).*")) return "Mastercard";
        if (number.matches("^3[47].*")) return "American Express";
        if (number.matches("^6(011|5).*")) return "Discover";
        return "Card";
    }

    private static ApiException paymentError(String message) {
        return new ApiException(HttpStatus.PAYMENT_REQUIRED, message);
    }
}
