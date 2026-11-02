package com.e_commerce.backend.user;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.security.CaptchaVerifier;
import com.e_commerce.backend.security.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Registration with email verification, login and the current user.
 * <p>
 * Sign-up flow: {@code register} (CAPTCHA-protected) creates an unverified account and emails a code;
 * {@code verify} confirms the code and only then returns a login token. Unverified accounts cannot log in.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record RegisterRequest(
            @NotBlank(message = "Enter your name") @Size(max = 100) String fullName,
            @NotBlank(message = "Enter your email") @Email(message = "Enter a valid email address") String email,
            @NotBlank @Size(min = 8, max = 100, message = "Passwords must be at least 8 characters") String password,
            String captchaToken) {}

    public record LoginRequest(@NotBlank(message = "Enter your email") String email,
                               @NotBlank(message = "Enter your password") String password,
                               String captchaToken) {}

    public record VerifyRequest(@NotBlank(message = "Enter your email") String email,
                                @NotBlank(message = "Enter the 6-digit code") String code) {}

    public record ResendRequest(@NotBlank(message = "Enter your email") String email) {}

    public record AuthResponse(String token, UserDto user) {}

    public record RegisterResponse(boolean verificationRequired, String email) {}

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final EmailVerificationService verification;
    private final CaptchaVerifier captcha;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens,
                          EmailVerificationService verification, CaptchaVerifier captcha) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.verification = verification;
        this.captcha = captcha;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RegisterResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        captcha.verify(req.captchaToken(), http.getRemoteAddr());
        String email = req.email().trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user != null && user.isEmailVerified()) {
            throw ApiException.conflict("An account with this email already exists");
        }
        if (user == null) {
            user = users.save(new User(email, passwordEncoder.encode(req.password()), req.fullName().trim(), Role.CUSTOMER));
        } else {
            // An abandoned, never-verified sign-up can be restarted; the account only becomes usable once verified.
            user.setFullName(req.fullName().trim());
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        verification.sendCode(user);
        return new RegisterResponse(true, email);
    }

    @PostMapping("/verify")
    public AuthResponse verify(@Valid @RequestBody VerifyRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Request a new verification code", "INVALID_CODE"));
        if (!user.isEmailVerified()) {
            verification.verify(user, req.code());
            user = users.findById(user.getId()).orElseThrow();
        }
        return new AuthResponse(tokens.issue(user), UserDto.from(user));
    }

    /** Always answers 204 for unknown or already-verified emails, so it cannot be used to discover accounts. */
    @PostMapping("/resend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resend(@Valid @RequestBody ResendRequest req) {
        users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> !u.isEmailVerified())
                .ifPresent(verification::sendCode);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        captcha.verify(req.captchaToken(), http.getRemoteAddr());
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                // Same message for unknown email and wrong password, so accounts cannot be enumerated.
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Please verify your email address to sign in", "EMAIL_NOT_VERIFIED");
        }
        return new AuthResponse(tokens.issue(user), UserDto.from(user));
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthUser me) {
        return users.findById(me.id()).map(UserDto::from).orElseThrow(() -> ApiException.notFound("User"));
    }
}
