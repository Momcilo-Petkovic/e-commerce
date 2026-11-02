package com.e_commerce.backend.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Used to award the "Verified Purchase" badge on reviews. */
    @Query("select count(oi) > 0 from OrderItem oi where oi.order.user.id = :userId and oi.product.id = :productId " +
            "and oi.order.status <> com.e_commerce.backend.order.OrderStatus.CANCELLED")
    boolean hasPurchased(@Param("userId") Long userId, @Param("productId") Long productId);
}
