package com.e_commerce.backend.order;

import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {}

    public record QuoteRequest(DeliveryOption deliveryOption, Long rewardId, Long rewardProductId) {}

    public record PaymentRequest(String cardNumber, String holderName, int expMonth, int expYear, String cvc) {}

    public record PlaceOrderRequest(Long addressId, DeliveryOption deliveryOption, Long rewardId, Long rewardProductId,
                                    PaymentRequest payment) {}

    public record QuoteLine(ProductSummary product, int quantity, BigDecimal lineTotal, BigDecimal discount) {}

    public record DeliveryChoice(DeliveryOption option, String label, BigDecimal price, LocalDate estimatedDelivery) {}

    public record Quote(List<QuoteLine> lines, int itemCount, BigDecimal subtotal, BigDecimal shipping, BigDecimal discount,
                        BigDecimal tax, BigDecimal total, String rewardApplied, List<DeliveryChoice> deliveryChoices) {}

    public record OrderItemDto(Long productId, String title, String thumbnail, BigDecimal unitPrice, int quantity,
                               BigDecimal discount, BigDecimal lineTotal) {
        static OrderItemDto from(OrderItem i) {
            return new OrderItemDto(i.getProduct().getId(), i.getTitle(), i.getThumbnail(), i.getUnitPrice(),
                    i.getQuantity(), i.getDiscount(), i.lineTotal());
        }
    }

    public record AddressSnapshot(String fullName, String line1, String line2, String city, String state,
                                  String postalCode, String country, String phone) {
        static AddressSnapshot from(ShippingAddress a) {
            return new AddressSnapshot(a.getFullName(), a.getLine1(), a.getLine2(), a.getCity(), a.getState(),
                    a.getPostalCode(), a.getCountry(), a.getPhone());
        }
    }

    public record StatusEventDto(OrderStatus status, Instant at) {}

    public record OrderDto(String orderNumber, OrderStatus status, Instant createdAt, Instant statusUpdatedAt,
                           DeliveryOption deliveryOption, String deliveryLabel, LocalDate estimatedDelivery,
                           AddressSnapshot shippingAddress, List<OrderItemDto> items,
                           BigDecimal subtotal, BigDecimal shippingCost, BigDecimal discount, BigDecimal tax, BigDecimal total,
                           String rewardLabel, String paymentBrand, String paymentLast4, String paymentReference,
                           List<StatusEventDto> history, String customerEmail, String customerName) {

        public static OrderDto from(CustomerOrder o) {
            return new OrderDto(o.getOrderNumber(), o.getStatus(), o.getCreatedAt(), o.getStatusUpdatedAt(),
                    o.getDeliveryOption(), o.getDeliveryOption().getLabel(), o.getEstimatedDelivery(),
                    AddressSnapshot.from(o.getShippingAddress()),
                    o.getItems().stream().map(OrderItemDto::from).toList(),
                    o.getSubtotal(), o.getShippingCost(), o.getDiscount(), o.getTax(), o.getTotal(),
                    o.getRewardLabel(), o.getPaymentBrand(), o.getPaymentLast4(), o.getPaymentReference(),
                    o.getHistory().stream().map(h -> new StatusEventDto(h.getStatus(), h.getAt())).toList(),
                    o.getUser().getEmail(), o.getUser().getFullName());
        }
    }
}
