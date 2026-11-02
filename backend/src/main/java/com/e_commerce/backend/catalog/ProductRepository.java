package com.e_commerce.backend.catalog;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("select p from Product p join fetch p.category where p.active = true order by p.soldCount desc")
    List<Product> findBestSellers(Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.active = true and p.reviewCount > 0 order by p.rating desc, p.reviewCount desc")
    List<Product> findTopRated(Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.active = true order by p.createdAt desc, p.id desc")
    List<Product> findNewest(Pageable pageable);

    @Query("select p from Product p join fetch p.category c where p.active = true and p.dealPercent > 0 and p.dealEndsAt > :now " +
            "and (:department is null or c.departmentSlug = :department) order by p.dealPercent desc")
    List<Product> findActiveDeals(@Param("now") Instant now, @Param("department") String department, Pageable pageable);

    @Query("select count(p) from Product p where p.active = true and p.dealPercent > 0 and p.dealEndsAt > :now")
    long countActiveDeals(@Param("now") Instant now);

    @Query("select p from Product p join fetch p.category c where p.active = true and c.departmentSlug = :department order by p.soldCount desc")
    List<Product> findTopInDepartment(@Param("department") String department, Pageable pageable);

    @Query("select p from Product p join fetch p.category c where p.active = true and c.id = :categoryId and p.id <> :excludeId order by p.rating desc")
    List<Product> findRelated(@Param("categoryId") Long categoryId, @Param("excludeId") Long excludeId, Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.active = true and p.id in :ids")
    List<Product> findActiveByIds(@Param("ids") Collection<Long> ids);

    @Query("select p.title from Product p where p.active = true and lower(p.title) like lower(concat('%', :q, '%')) order by p.soldCount desc")
    List<String> suggestTitles(@Param("q") String q, Pageable pageable);

    @Query("select p from Product p join fetch p.category where p.active = true and p.stock <= :threshold order by p.stock asc")
    List<Product> findLowStock(@Param("threshold") int threshold, Pageable pageable);

    @Query("select p from Product p where p.dealPercent is not null and p.dealEndsAt is not null and p.dealEndsAt <= :now")
    List<Product> findExpiredDeals(@Param("now") Instant now);

    @Query("select p from Product p where p.active = true and p.dealPercent is null and p.stock > 0")
    List<Product> findDealCandidates(Pageable pageable);
}
