package com.e_commerce.backend.wheel;

import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.wheel.WheelDtos.RewardDto;
import com.e_commerce.backend.wheel.WheelDtos.SegmentDto;
import com.e_commerce.backend.wheel.WheelDtos.SpinResult;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class WheelController {

    private final WheelService wheel;

    public WheelController(WheelService wheel) {
        this.wheel = wheel;
    }

    /** Segment labels/colours only; weights (odds) stay private. */
    @GetMapping("/wheel/segments")
    public List<SegmentDto> segments() {
        return wheel.publicSegments();
    }

    @PostMapping("/wheel/spin")
    public SpinResult spin(@AuthenticationPrincipal AuthUser me) {
        return wheel.spin(me.id());
    }

    @GetMapping("/rewards")
    public List<RewardDto> rewards(@AuthenticationPrincipal AuthUser me) {
        return wheel.rewardsOf(me.id());
    }
}
