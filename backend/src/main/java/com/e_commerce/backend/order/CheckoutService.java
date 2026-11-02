package com.e_commerce.backend.order;

import com.e_commerce.backend.address.Address;
import com.e_commerce.backend.address.AddressRepository;
import com.e_commerce.backend.cart.CartItem;
import com.e_commerce.backend.cart.CartItemRepository;
import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductDtos.ProductSummary;
import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.common.Money;
import com.e_commerce.backend.order.OrderDtos.*;
import com.e_commerce.backend.user.UserRepository;
import com.e_commerce.backend.wheel.Reward;
import com.e_commerce.backend.wheel.RewardRepository;
import com.e_commerce.backend.wheel.RewardType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Prices the cart and turns it into an order.
 * <p>
 * The same {@link #price} routine is used for the live checkout summary ("quote") and for placing
 * the order, so the customer is always charged exactly what they were shown.
 */
@Service
public class CheckoutService {

    private final CartItemRepository cartItems;
    private final AddressRepository addresses;
    private final RewardRepository rewards;
    private final OrderRepository orders;
    private final UserRepository users;
    private final PaymentGateway paymentGateway;
    private final BigDecimal taxRate;
    private final SecureRandom random = new SecureRandom();

    public CheckoutService(CartItemRepository cartItems, AddressRepository addresses, RewardRepository rewards,
                           OrderRepository orders, UserRepository users, PaymentGateway paymentGateway,
                           @Value("${app.checkout.tax-rate:0.08}") BigDecimal taxRate) {
        this.cartItems = cartItems;
        this.addresses = addresses;
        this.rewards = rewards;
        this.orders = orders;
        this.users = users;
        this.paymentGateway = paymentGateway;
        this.taxRate = taxRate;
    }

    /** Internal pricing result, shared by quote and order placement. */
    private record Priced(List<CartItem> items, List<QuoteLine> lines, BigDecimal subtotal, BigDecimal shipping,
                          BigDecimal discount, BigDecimal tax, BigDecimal total, Reward reward, Long rewardProductId,
                          BigDecimal rewardLineDiscount) {}

    @Transactional(readOnly = true)
    public Quote quote(Long userId, QuoteRequest req) {
        Priced p = price(userId, req.deliveryOption(), req.rewardId(), req.rewardProductId());
        List<DeliveryChoice> choices = Arrays.stream(DeliveryOption.values())
                .map(o -> new DeliveryChoice(o, o.getLabel(),
                        p.reward() != null && p.reward().getType() == RewardType.FREE_SHIPPING ? Money.of(0) : o.priceFor(p.subtotal()),
                        estimateDelivery(o)))
                .toList();
        int count = p.items().stream().mapToInt(CartItem::getQuantity).sum();
        return new Quote(p.lines(), count, p.subtotal(), p.shipping(), p.discount(), p.tax(), p.total(),
                p.reward() == null ? null : p.reward().getLabel(), choices);
    }

    @Transactional
    public OrderDto placeOrder(Long userId, PlaceOrderRequest req) {
        if (req.addressId() == null) {
            throw ApiException.badRequest("Choose a delivery address");
        }
        if (req.payment() == null) {
            throw ApiException.badRequest("Enter your payment details");
        }
        Address address = addresses.findByIdAndUserId(req.addressId(), userId)
                .orElseThrow(() -> ApiException.notFound("Address"));
        DeliveryOption delivery = req.deliveryOption() == null ? DeliveryOption.STANDARD : req.deliveryOption();
        Priced p = price(userId, delivery, req.rewardId(), req.rewardProductId());

        // Stock check happens before charging the card.
        for (CartItem ci : p.items()) {
            if (ci.getProduct().getStock() < ci.getQuantity()) {
                throw ApiException.conflict("Only " + ci.getProduct().getStock() + " left of \"" + ci.getProduct().getTitle() + "\". Please update your cart.");
            }
        }

        PaymentRequest pay = req.payment();
        PaymentGateway.PaymentResult payment = paymentGateway.charge(
                new PaymentGateway.CardDetails(pay.cardNumber(), pay.holderName(), pay.expMonth(), pay.expYear(), pay.cvc()),
                p.total());

        CustomerOrder order = new CustomerOrder(newOrderNumber(), users.getReferenceById(userId));
        order.setShippingAddress(ShippingAddress.of(address));
        order.setDeliveryOption(delivery);
        order.setEstimatedDelivery(estimateDelivery(delivery));
        order.setSubtotal(p.subtotal());
        order.setShippingCost(p.shipping());
        order.setDiscount(p.discount());
        order.setTax(p.tax());
        order.setTotal(p.total());
        order.setPaymentBrand(payment.brand());
        order.setPaymentLast4(payment.last4());
        order.setPaymentReference(payment.reference());

        for (CartItem ci : p.items()) {
            Product product = ci.getProduct();
            OrderItem item = new OrderItem(product, product.effectivePrice(), ci.getQuantity());
            if (p.rewardProductId() != null && p.rewardProductId().equals(product.getId())) {
                item.setDiscount(p.rewardLineDiscount());
            }
            order.addItem(item);
            product.setStock(product.getStock() - ci.getQuantity());
            product.setSoldCount(product.getSoldCount() + ci.getQuantity());
        }
        if (p.reward() != null) {
            p.reward().markUsed(order.getOrderNumber());
            order.setRewardLabel(p.reward().getLabel());
        }
        orders.save(order);
        cartItems.deleteAll(p.items());
        return OrderDto.from(order);
    }

    private Priced price(Long userId, DeliveryOption option, Long rewardId, Long rewardProductId) {
        DeliveryOption delivery = option == null ? DeliveryOption.STANDARD : option;
        List<CartItem> items = cartItems.findByUserWithProduct(userId).stream()
                .filter(ci -> !ci.isSavedForLater() && ci.getProduct().isActive())
                .toList();
        if (items.isEmpty()) {
            throw ApiException.badRequest("Your cart is empty");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : items) {
            subtotal = subtotal.add(ci.getProduct().effectivePrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }
        subtotal = Money.round(subtotal);
        BigDecimal shipping = delivery.priceFor(subtotal);

        Reward reward = null;
        BigDecimal discount = BigDecimal.ZERO;
        Long discountedProductId = null;
        if (rewardId != null) {
            reward = rewards.findByIdAndUserId(rewardId, userId)
                    .filter(Reward::isUsable)
                    .orElseThrow(() -> ApiException.badRequest("This reward is no longer available"));
            switch (reward.getType()) {
                case FREE_SHIPPING -> shipping = Money.of(0);
                case PERCENT_OFF, FREE_ITEM -> {
                    CartItem target = items.stream()
                            .filter(ci -> ci.getProduct().getId().equals(rewardProductId))
                            .findFirst()
                            .orElseThrow(() -> ApiException.badRequest("Choose which item in your cart the reward applies to"));
                    BigDecimal unit = target.getProduct().effectivePrice();
                    // Rewards apply to a single unit of the chosen item.
                    discount = reward.getType() == RewardType.FREE_ITEM ? unit : Money.percentOf(unit, reward.getValue());
                    discountedProductId = target.getProduct().getId();
                }
            }
        }

        BigDecimal taxable = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal tax = Money.round(taxable.multiply(taxRate));
        BigDecimal total = Money.round(taxable.add(shipping).add(tax));

        List<QuoteLine> lines = new ArrayList<>();
        for (CartItem ci : items) {
            ProductSummary s = ProductSummary.from(ci.getProduct());
            BigDecimal lineDiscount = ci.getProduct().getId().equals(discountedProductId) ? discount : BigDecimal.ZERO;
            lines.add(new QuoteLine(s, ci.getQuantity(), s.price().multiply(BigDecimal.valueOf(ci.getQuantity())), lineDiscount));
        }
        return new Priced(items, lines, subtotal, shipping, Money.round(discount), tax, total, reward, discountedProductId, discount);
    }

    /** Adds business days (skipping weekends) to today. */
    static LocalDate estimateDelivery(DeliveryOption option) {
        LocalDate date = LocalDate.now();
        int remaining = option.getBusinessDays();
        while (remaining > 0) {
            date = date.plusDays(1);
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                remaining--;
            }
        }
        return date;
    }

    private String newOrderNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String number;
        do {
            number = "EC-" + date + "-" + String.format("%06d", random.nextInt(1_000_000));
        } while (orders.existsByOrderNumber(number));
        return number;
    }
}
