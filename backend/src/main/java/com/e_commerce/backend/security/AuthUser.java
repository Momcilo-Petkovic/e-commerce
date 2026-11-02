package com.e_commerce.backend.security;

/** Authenticated principal stored in the SecurityContext; injected into controllers via {@code @AuthenticationPrincipal}. */
public record AuthUser(Long id, String email, String role) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
