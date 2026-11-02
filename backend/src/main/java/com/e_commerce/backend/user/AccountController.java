package com.e_commerce.backend.user;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** "Login &amp; Security" settings of the signed-in user. */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    public record ProfileRequest(@NotBlank(message = "Enter your name") @Size(max = 100) String fullName,
                                 @NotBlank @Email(message = "Enter a valid email address") String email) {}

    public record PasswordRequest(@NotBlank(message = "Enter your current password") String currentPassword,
                                  @NotBlank @Size(min = 8, max = 100, message = "Passwords must be at least 8 characters") String newPassword) {}

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AccountController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @PutMapping("/profile")
    @Transactional
    public UserDto updateProfile(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody ProfileRequest req) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User"));
        String email = req.email().trim().toLowerCase();
        if (!email.equalsIgnoreCase(user.getEmail()) && users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("That email is already used by another account");
        }
        user.setFullName(req.fullName().trim());
        user.setEmail(email);
        return UserDto.from(user);
    }

    @PutMapping("/password")
    @Transactional
    public void changePassword(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody PasswordRequest req) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User"));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Your current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
    }
}
