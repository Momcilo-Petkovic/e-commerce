package com.e_commerce.backend.wheel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WheelSegmentRepository extends JpaRepository<WheelSegment, Long> {

    List<WheelSegment> findAllByOrderByPositionAsc();
}
