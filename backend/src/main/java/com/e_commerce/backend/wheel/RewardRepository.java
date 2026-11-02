package com.e_commerce.backend.wheel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    List<Reward> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Reward> findByIdAndUserId(Long id, Long userId);

    Optional<Reward> findByUsedOnOrder(String orderNumber);
}
