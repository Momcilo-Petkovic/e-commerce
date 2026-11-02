package com.e_commerce.backend.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    @Query("select o from CustomerOrder o where o.user.id = :userId and o.createdAt >= :since order by o.createdAt desc")
    List<CustomerOrder> findByUserSince(@Param("userId") Long userId, @Param("since") Instant since);

    Optional<CustomerOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    @Query("select o from CustomerOrder o where o.status in :statuses")
    List<CustomerOrder> findByStatusIn(@Param("statuses") Collection<OrderStatus> statuses);

    @Query(value = "select o from CustomerOrder o join fetch o.user where (:status is null or o.status = :status) " +
            "and (:q is null or lower(o.orderNumber) like lower(concat('%', :q, '%')) or lower(o.user.email) like lower(concat('%', :q, '%'))) " +
            "order by o.createdAt desc",
            countQuery = "select count(o) from CustomerOrder o where (:status is null or o.status = :status) " +
                    "and (:q is null or lower(o.orderNumber) like lower(concat('%', :q, '%')) or lower(o.user.email) like lower(concat('%', :q, '%')))")
    Page<CustomerOrder> search(@Param("status") OrderStatus status, @Param("q") String q, Pageable pageable);

    @Query("select coalesce(sum(o.total), 0) from CustomerOrder o where o.status not in :excluded")
    BigDecimal sumRevenue(@Param("excluded") Collection<OrderStatus> excluded);

    @Query("select count(o) from CustomerOrder o where o.status not in :excluded")
    long countValid(@Param("excluded") Collection<OrderStatus> excluded);

    @Query("select o from CustomerOrder o where o.createdAt >= :since")
    List<CustomerOrder> findSince(@Param("since") Instant since);

    @Query("select o.status, count(o) from CustomerOrder o group by o.status")
    List<Object[]> countByStatus();

    long countByUserId(Long userId);
}
