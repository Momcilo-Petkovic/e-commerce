package com.e_commerce.backend.wheel;

import java.time.Instant;

public final class WheelDtos {

    private WheelDtos() {}

    public record SegmentDto(Long id, String label, RewardType type, int value, String color) {
        static SegmentDto from(WheelSegment s) {
            return new SegmentDto(s.getId(), s.getLabel(), s.getType(), s.getValue(), s.getColor());
        }
    }

    /** Admin view, including the weight and the resulting probability. */
    public record AdminSegmentDto(Long id, String label, RewardType type, int value, int weight, String color, double probability) {}

    public record RewardDto(Long id, RewardType type, int value, String label, Instant createdAt, Instant expiresAt,
                            Instant usedAt, String usedOnOrder, boolean usable) {
        public static RewardDto from(Reward r) {
            return new RewardDto(r.getId(), r.getType(), r.getValue(), r.getLabel(), r.getCreatedAt(), r.getExpiresAt(),
                    r.getUsedAt(), r.getUsedOnOrder(), r.isUsable());
        }
    }

    /** {@code segmentIndex} tells the frontend where the wheel must stop. */
    public record SpinResult(int segmentIndex, SegmentDto segment, RewardDto reward) {}
}
