package com.e_commerce.backend.user;

import java.time.Instant;

/** Public view of a user account (never exposes the password hash). */
public record UserDto(Long id, String email, String fullName, Role role, boolean wheelSpun, Instant createdAt) {

    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isWheelSpun(), u.getCreatedAt());
    }
}
