package com.e_commerce.backend.wheel;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.user.User;
import com.e_commerce.backend.user.UserRepository;
import com.e_commerce.backend.wheel.WheelDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Wheel of Fortune game logic.
 * <p>
 * The outcome is decided on the server with a weighted random draw, never in the browser,
 * so the odds cannot be manipulated. Each account can spin exactly once.
 */
@Service
@Transactional
public class WheelService {

    static final Duration REWARD_VALIDITY = Duration.ofDays(30);

    private final WheelSegmentRepository segments;
    private final RewardRepository rewards;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    public WheelService(WheelSegmentRepository segments, RewardRepository rewards, UserRepository users) {
        this.segments = segments;
        this.rewards = rewards;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<SegmentDto> publicSegments() {
        return segments.findAllByOrderByPositionAsc().stream().map(SegmentDto::from).toList();
    }

    public SpinResult spin(Long userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        if (user.isWheelSpun()) {
            throw ApiException.conflict("You have already used your spin");
        }
        List<WheelSegment> all = segments.findAllByOrderByPositionAsc();
        int totalWeight = all.stream().mapToInt(WheelSegment::getWeight).sum();
        if (all.isEmpty() || totalWeight <= 0) {
            throw ApiException.badRequest("The wheel is not available right now");
        }

        // Weighted draw: pick a ticket in [0, totalWeight) and find the segment that owns it.
        int ticket = random.nextInt(totalWeight);
        int index = 0;
        for (int cumulative = 0; index < all.size(); index++) {
            cumulative += all.get(index).getWeight();
            if (ticket < cumulative) {
                break;
            }
        }
        WheelSegment won = all.get(index);

        user.setWheelSpun(true);
        Reward reward = rewards.save(new Reward(user, won.getType(), won.getValue(), describe(won),
                Instant.now().plus(REWARD_VALIDITY)));
        return new SpinResult(index, SegmentDto.from(won), RewardDto.from(reward));
    }

    @Transactional(readOnly = true)
    public List<RewardDto> rewardsOf(Long userId) {
        return rewards.findByUserIdOrderByCreatedAtDesc(userId).stream().map(RewardDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminSegmentDto> adminSegments() {
        List<WheelSegment> all = segments.findAllByOrderByPositionAsc();
        double total = all.stream().mapToInt(WheelSegment::getWeight).sum();
        return all.stream().map(s -> new AdminSegmentDto(s.getId(), s.getLabel(), s.getType(), s.getValue(),
                s.getWeight(), s.getColor(), total == 0 ? 0 : s.getWeight() / total)).toList();
    }

    /** Replaces the whole wheel configuration (admin). */
    public List<AdminSegmentDto> replaceSegments(List<AdminSegmentDto> input) {
        if (input.size() < 2 || input.size() > 12) {
            throw ApiException.badRequest("The wheel needs between 2 and 12 segments");
        }
        if (input.stream().anyMatch(s -> s.weight() < 0 || s.label() == null || s.label().isBlank() || s.type() == null)) {
            throw ApiException.badRequest("Every segment needs a label, a type and a non-negative weight");
        }
        if (input.stream().mapToInt(AdminSegmentDto::weight).sum() <= 0) {
            throw ApiException.badRequest("At least one segment must have a weight above zero");
        }
        if (input.stream().anyMatch(s -> s.type() == RewardType.PERCENT_OFF && (s.value() < 1 || s.value() > 99))) {
            throw ApiException.badRequest("Percentage discounts must be between 1 and 99");
        }
        segments.deleteAllInBatch();
        for (int i = 0; i < input.size(); i++) {
            AdminSegmentDto s = input.get(i);
            segments.save(new WheelSegment(s.label().trim(), s.type(), s.value(), s.weight(),
                    s.color() == null || s.color().isBlank() ? "#0f766e" : s.color(), i));
        }
        return adminSegments();
    }

    private static String describe(WheelSegment s) {
        return switch (s.getType()) {
            case PERCENT_OFF -> s.getValue() + "% off an item of your choice";
            case FREE_SHIPPING -> "Free delivery on your next order";
            case FREE_ITEM -> "A free item of your choice";
        };
    }
}
