package com.e_commerce.backend.security;

import com.e_commerce.backend.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Issues and verifies stateless JSON Web Tokens signed with HMAC-SHA256.
 * <p>
 * Implemented with the JDK's crypto API to keep the dependency footprint small.
 * The signing secret comes from {@code app.jwt.secret}; if it is not configured a random
 * secret is generated at startup (tokens then become invalid after a restart, which is fine for local development).
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();
    private static final String HEADER = B64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    private static final Pattern SUB = Pattern.compile("\"sub\":\"(\\d+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final byte[] secret;
    private final Duration ttl;

    public TokenService(@Value("${app.jwt.secret:}") String configuredSecret,
                        @Value("${app.jwt.ttl-hours:168}") long ttlHours) {
        if (configuredSecret == null || configuredSecret.length() < 32) {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            this.secret = random;
            log.warn("app.jwt.secret is not set (or shorter than 32 chars) - using a random signing key. Users will be logged out on restart.");
        } else {
            this.secret = configuredSecret.getBytes(StandardCharsets.UTF_8);
        }
        this.ttl = Duration.ofHours(ttlHours);
    }

    public String issue(User user) {
        long exp = Instant.now().plus(ttl).getEpochSecond();
        String payload = "{\"sub\":\"" + user.getId() + "\",\"role\":\"" + user.getRole() + "\",\"exp\":" + exp + "}";
        String unsigned = HEADER + "." + B64.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return unsigned + "." + sign(unsigned);
    }

    /** Returns the user id contained in a valid, non-expired token. */
    public Optional<Long> verify(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !parts[0].equals(HEADER)) {
                return Optional.empty();
            }
            String expected = sign(parts[0] + "." + parts[1]);
            // Constant-time comparison prevents timing attacks on the signature.
            if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), parts[2].getBytes(StandardCharsets.US_ASCII))) {
                return Optional.empty();
            }
            String payload = new String(B64D.decode(parts[1]), StandardCharsets.UTF_8);
            Matcher exp = EXP.matcher(payload);
            Matcher sub = SUB.matcher(payload);
            if (!exp.find() || !sub.find() || Long.parseLong(exp.group(1)) < Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(sub.group(1)));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return B64.encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to sign token", e);
        }
    }
}
