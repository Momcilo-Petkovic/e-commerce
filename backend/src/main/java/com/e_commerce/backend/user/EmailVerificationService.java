package com.e_commerce.backend.user;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.common.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

/**
 * Issues and checks the 6-digit codes that confirm a customer owns their email address.
 * <ul>
 *   <li>Codes come from {@link SecureRandom} and are stored only as BCrypt hashes.</li>
 *   <li>A code expires after {@value #VALID_MINUTES} minutes and allows {@value #MAX_ATTEMPTS} wrong guesses,
 *       which makes guessing a 1-in-a-million code impractical.</li>
 *   <li>A new code can be requested once every {@value #RESEND_SECONDS} seconds.</li>
 * </ul>
 */
@Service
@Transactional
public class EmailVerificationService {

    static final long VALID_MINUTES = 10;
    static final int MAX_ATTEMPTS = 5;
    static final long RESEND_SECONDS = 60;

    private final EmailVerificationRepository verifications;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(EmailVerificationRepository verifications, PasswordEncoder passwordEncoder,
                                    EmailService emailService) {
        this.verifications = verifications;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /** Creates or replaces the pending code for the user and emails it. */
    public void sendCode(User user) {
        EmailVerification verification = verifications.findByUserId(user.getId())
                .orElseGet(() -> new EmailVerification(user));
        Instant now = Instant.now();
        if (verification.getSentAt() != null && verification.getSentAt().plusSeconds(RESEND_SECONDS).isAfter(now)) {
            long wait = Duration.between(now, verification.getSentAt().plusSeconds(RESEND_SECONDS)).toSeconds() + 1;
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Please wait " + wait + " seconds before requesting a new code", "RESEND_TOO_SOON");
        }
        String code = String.format("%06d", random.nextInt(1_000_000));
        verification.reset(passwordEncoder.encode(code), now, now.plus(Duration.ofMinutes(VALID_MINUTES)));
        verifications.save(verification);
        emailService.sendVerificationCode(user.getEmail(), user.getFullName(), code, VALID_MINUTES);
    }

    /** Marks the user as verified if the code is correct; otherwise records the failed attempt. */
    @Transactional(noRollbackFor = ApiException.class)
    public void verify(User user, String code) {
        EmailVerification verification = verifications.findByUserId(user.getId())
                .orElseThrow(() -> invalid("Request a new verification code"));
        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw invalid("This code has expired. Request a new one.");
        }
        if (verification.getFailedAttempts() >= MAX_ATTEMPTS) {
            throw invalid("Too many incorrect attempts. Request a new code.");
        }
        if (code == null || !code.trim().matches("\\d{6}") || !passwordEncoder.matches(code.trim(), verification.getCodeHash())) {
            // Committed even though the request fails (noRollbackFor), so wrong guesses always count.
            verification.recordFailedAttempt();
            int left = MAX_ATTEMPTS - verification.getFailedAttempts();
            throw invalid(left > 0 ? "That code isn't right. " + left + (left == 1 ? " attempt" : " attempts") + " left."
                    : "Too many incorrect attempts. Request a new code.");
        }
        // The user loaded through the verification is managed by this transaction, so the change is persisted.
        verification.getUser().setEmailVerified(true);
        verifications.delete(verification);
    }

    private static ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, "INVALID_CODE");
    }
}
