package com.e_commerce.backend.security;

import com.e_commerce.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads the {@code Authorization: Bearer <token>} header and, if the token is valid,
 * authenticates the request. The user is re-loaded from the database so that role changes
 * and deleted accounts take effect immediately.
 * <p>
 * Intentionally not a Spring bean: it is added to the security chain only, so it never runs twice.
 */
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserRepository users;

    public TokenAuthenticationFilter(TokenService tokenService, UserRepository users) {
        this.tokenService = tokenService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            tokenService.verify(header.substring(7))
                    .flatMap(users::findById)
                    .ifPresent(user -> {
                        AuthUser principal = new AuthUser(user.getId(), user.getEmail(), user.getRole().name());
                        var auth = new UsernamePasswordAuthenticationToken(principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
        }
        chain.doFilter(request, response);
    }
}
