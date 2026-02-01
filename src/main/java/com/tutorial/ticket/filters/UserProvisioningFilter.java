package com.tutorial.ticket.filters;

import com.tutorial.ticket.domain.entities.User;
import com.tutorial.ticket.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserProvisioningFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // No auth -> continue
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // We only care if the principal is a Jwt
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Jwt jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Convert Keycloak subject -> UUID (safe)
        UUID keycloakId;
        try {
            keycloakId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException ex) {
            // If sub isn't a UUID, don't break the request
            filterChain.doFilter(request, response);
            return;
        }

        // Create user if not exists
        if (!userRepository.existsById(keycloakId)) {
            User user = new User();
            user.setId(keycloakId);

            String username = Optional.ofNullable(jwt.getClaimAsString("preferred_username"))
                    .filter(s -> !s.isBlank())
                    .orElseGet(() -> Optional.ofNullable(jwt.getClaimAsString("name"))
                            .filter(s -> !s.isBlank())
                            .orElse("Unknown"));

            user.setName(username);

            // Email might be null if Keycloak doesn't send it
            user.setEmail(jwt.getClaimAsString("email"));

            userRepository.save(user);
        }

        filterChain.doFilter(request, response);
    }
}
