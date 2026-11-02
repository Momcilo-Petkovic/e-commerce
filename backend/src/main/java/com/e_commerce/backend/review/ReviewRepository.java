package com.e_commerce.backend.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    Page<Review> findByProductIdAndRating(Long productId, int rating, Pageable pageable);

    boolean existsByProductIdAndUserId(Long productId, Long userId);

    /** Returns rows of [rating, count] for the rating histogram on the product page. */
    @Query("select r.rating, count(r) from Review r where r.product.id = :productId group by r.rating")
    List<Object[]> countByRating(@Param("productId") Long productId);

    @Query("select avg(r.rating), count(r) from Review r where r.product.id = :productId")
    List<Object[]> aggregate(@Param("productId") Long productId);

    @Query(value = "select r from Review r join fetch r.product order by r.createdAt desc",
            countQuery = "select count(r) from Review r")
    Page<Review> findAllWithProduct(Pageable pageable);
}
