package com.tutorial.ticket.config;

import com.tutorial.ticket.filters.UserProvisioningFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/published-events/**",
            "/actuator/health",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            UserProvisioningFilter userProvisioningFilter
    ) throws Exception {

        http
                // Stateless API: disable CSRF for token-based auth
                .csrf(csrf -> csrf.disable())

                // If you're calling from a frontend (ex: Vite localhost:5173),
                // keep this enabled and define a CorsConfigurationSource bean.
                .cors(Customizer.withDefaults())

                // No HTTP session stored server-side (JWT is sent each request)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )

                // JWT Resource Server (Keycloak / Auth0 / etc.)
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(Customizer.withDefaults())
                )

                // Run provisioning AFTER bearer token auth has happened
                .addFilterAfter(userProvisioningFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }
}
