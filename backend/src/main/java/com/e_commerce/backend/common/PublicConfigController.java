package com.e_commerce.backend.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Non-secret settings the frontend needs at runtime, so they are configured in one place (the backend). */
@RestController
public class PublicConfigController {

    public record PublicConfig(boolean captchaEnabled, String turnstileSiteKey) {}

    private final PublicConfig config;

    public PublicConfigController(@Value("${app.turnstile.enabled:true}") boolean captchaEnabled,
                                  @Value("${app.turnstile.site-key}") String siteKey) {
        this.config = new PublicConfig(captchaEnabled, siteKey);
    }

    @GetMapping("/api/config")
    public PublicConfig config() {
        return config;
    }
}
