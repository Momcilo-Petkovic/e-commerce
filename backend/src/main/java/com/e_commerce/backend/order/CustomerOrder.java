package com.e_commerce.backend.order;

import com.e_commerce.backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** A placed order. Named CustomerOrder because ORDER is a reserved SQL keyword. */
@Entity
@Table(name = "customer_orders", indexes = @Index(name = "idx_order_user", columnList = "user_id"))
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-friendly identifier shown to customers, e.g. EC-261102-482913. */
    @Column(nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(nullable = false)
    private Instant statusUpdatedAt = Instant.now();

    @Embedded
    private ShippingAddress shippingAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryOption deliveryOption;

    @Column(nullable = false)
    private LocalDate estimatedDelivery;

    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal subtotal;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal shippingCost;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal discount;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal tax;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal total;

    private String rewardLabel;

    private String paymentBrand;
    private String paymentLast4;
    private String paymentReference;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderItem> items = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "order_status_history", joinColumns = @JoinColumn(name = "order_id"))
    @OrderColumn(name = "position")
    private List<StatusEvent> history = new ArrayList<>();

    protected CustomerOrder() {}

    public CustomerOrder(String orderNumber, User user) {
        this.orderNumber = orderNumber;
        this.user = user;
        this.history.add(new StatusEvent(OrderStatus.PLACED, createdAt));
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public void changeStatus(OrderStatus newStatus) {
        if (newStatus == status) {
            return;
        }
        this.status = newStatus;
        this.statusUpdatedAt = Instant.now();
        this.history.add(new StatusEvent(newStatus, statusUpdatedAt));
    }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public User getUser() { return user; }
    public OrderStatus getStatus() { return status; }
    public Instant getStatusUpdatedAt() { return statusUpdatedAt; }
    public ShippingAddress getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(ShippingAddress shippingAddress) { this.shippingAddress = shippingAddress; }
    public DeliveryOption getDeliveryOption() { return deliveryOption; }
    public void setDeliveryOption(DeliveryOption deliveryOption) { this.deliveryOption = deliveryOption; }
    public LocalDate getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(LocalDate estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getRewardLabel() { return rewardLabel; }
    public void setRewardLabel(String rewardLabel) { this.rewardLabel = rewardLabel; }
    public String getPaymentBrand() { return paymentBrand; }
    public void setPaymentBrand(String paymentBrand) { this.paymentBrand = paymentBrand; }
    public String getPaymentLast4() { return paymentLast4; }
    public void setPaymentLast4(String paymentLast4) { this.paymentLast4 = paymentLast4; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderItem> getItems() { return items; }
    public List<StatusEvent> getHistory() { return history; }
}
