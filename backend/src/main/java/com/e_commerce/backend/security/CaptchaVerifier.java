package com.e_commerce.backend.security;

import com.e_commerce.backend.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Pattern;

/**
 * Server-side check of Cloudflare Turnstile tokens (a free, privacy-friendly CAPTCHA).
 * <p>
 * The browser widget produces a single-use token; it only counts once Cloudflare's
 * {@code siteverify} endpoint confirms it with the secret key, so the check cannot be skipped
 * by calling the API directly. Defaults use Cloudflare's public test keys, which always pass,
 * so the project works out of the box on localhost.
 */
@Component
public class CaptchaVerifier {

    private static final Logger log = LoggerFactory.getLogger(CaptchaVerifier.class);
    private static final URI SITEVERIFY = URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    private static final Pattern SUCCESS = Pattern.compile("\"success\"\\s*:\\s*true");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final boolean enabled;
    private final String secret;

    public CaptchaVerifier(@Value("${app.turnstile.enabled:true}") boolean enabled,
                           @Value("${app.turnstile.secret-key}") String secret) {
        this.enabled = enabled;
        this.secret = secret;
    }

    public void verify(String token, String remoteIp) {
        if (!enabled) {
            return;
        }
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please complete the security check", "CAPTCHA_FAILED");
        }
        String form = "secret=" + encode(secret) + "&response=" + encode(token)
                + (remoteIp == null ? "" : "&remoteip=" + encode(remoteIp));
        try {
            HttpRequest request = HttpRequest.newBuilder(SITEVERIFY)
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || !SUCCESS.matcher(response.body()).find()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "The security check failed. Please try again.", "CAPTCHA_FAILED");
            }
        } catch (java.io.IOException e) {
            log.warn("Turnstile verification unavailable: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The security check is unavailable. Please try again.", "CAPTCHA_FAILED");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The security check is unavailable. Please try again.", "CAPTCHA_FAILED");
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
