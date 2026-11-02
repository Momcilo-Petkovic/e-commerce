package com.e_commerce.backend.user;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.security.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Registration, login and the currently logged-in user. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record RegisterRequest(
            @NotBlank(message = "Enter your name") @Size(max = 100) String fullName,
            @NotBlank(message = "Enter your email") @Email(message = "Enter a valid email address") String email,
            @NotBlank @Size(min = 8, max = 100, message = "Passwords must be at least 8 characters") String password) {}

    public record LoginRequest(@NotBlank(message = "Enter your email") String email,
                               @NotBlank(message = "Enter your password") String password) {}

    public record AuthResponse(String token, UserDto user) {}

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = users.save(new User(email, passwordEncoder.encode(req.password()), req.fullName().trim(), Role.CUSTOMER));
        return new AuthResponse(tokens.issue(user), UserDto.from(user));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                // Same message for unknown email and wrong password, so accounts cannot be enumerated.
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        return new AuthResponse(tokens.issue(user), UserDto.from(user));
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthUser me) {
        return users.findById(me.id()).map(UserDto::from).orElseThrow(() -> ApiException.notFound("User"));
    }
}
