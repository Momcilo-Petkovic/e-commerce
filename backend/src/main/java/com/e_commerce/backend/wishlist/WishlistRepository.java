package com.e_commerce.backend.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    @Query("select w from WishlistItem w join fetch w.product p join fetch p.category where w.user.id = :userId and p.active = true order by w.addedAt desc")
    List<WishlistItem> findByUserWithProduct(@Param("userId") Long userId);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);
}
