package za.ac.cput.dealnest.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import za.ac.cput.dealnest.security.JwtAuthFilter;
import za.ac.cput.dealnest.security.JwtUtil;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;

    public SecurityConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.cors(org.springframework.security.config.Customizer.withDefaults());
        http.csrf(csrf -> csrf.disable());

        // REST API — disable browser-based login flows; JWT carries all state
        http.httpBasic(basic -> basic.disable());
        http.formLogin(form -> form.disable());

        // Stateless: Spring will never create or use an HTTP session
        http.sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Wire JWT filter to run before Spring's default auth filter
        http.addFilterBefore(new JwtAuthFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        // Distinguish "you are not signed in" (401) from "you lack the role" (403)
        // so the frontend can tell a stale/expired session apart from a genuine denial.
        http.exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                            "{\"message\":\"Authentication required. Please sign in again.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                            "{\"message\":\"You don't have permission to perform this action.\"}");
                }));

        http.authorizeHttpRequests(authorize -> authorize

                // ----------------------------------------------------------------
                // PUBLIC endpoints — no login required
                // ----------------------------------------------------------------

                // Health check — plain /health is what the keep-alive cron and Render probe hit
                .requestMatchers("/api/health/**", "/health").permitAll()

                // Auth: registration & login for both user types
                .requestMatchers(HttpMethod.POST, "/api/user/create").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/user/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()

                // Promotions: anyone can browse active deals and price history
                .requestMatchers(HttpMethod.GET, "/api/promotion/findByIsActiveTrue").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/promotion/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/promotion/read/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/promotion/findByStoreId/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/priceHistory/findByPromotionId/**").permitAll()

                // Stores: anyone can browse stores
                .requestMatchers(HttpMethod.GET, "/api/stores").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stores/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/stores/findByUserId/**").permitAll()

                // Reviews: anyone can read reviews for a store
                .requestMatchers(HttpMethod.GET, "/api/review/read/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/review/findByStoreId/**").permitAll()

                // ----------------------------------------------------------------
                // ADMIN-only endpoints
                // ----------------------------------------------------------------

                // Full admin resource management (create, read, update, delete admins)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Admin: view all users & hard-delete a user account
                .requestMatchers(HttpMethod.GET, "/api/user/getAll").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/user/delete/**").hasRole("ADMIN")

                // Admin: full promotion management (create, update, delete, view all)
                // Create/update/delete also accept store owners, who are authorization-checked
                // in PromotionController against ownership of the promotion's store.
                .requestMatchers(HttpMethod.POST, "/api/promotion/create").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/promotion/update/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/promotion/delete/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/promotion/getAll").hasRole("ADMIN")

                // Admin: manage store locations
                .requestMatchers(HttpMethod.POST, "/api/location/create").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/location/update/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/location/delete/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/location/getAll").hasRole("ADMIN")

                // Admin: review moderation (delete any review, view all reviews)
                .requestMatchers(HttpMethod.DELETE, "/api/review/delete/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/review/getAll").hasRole("ADMIN")

                // Admin: deal report resolution & oversight
                .requestMatchers(HttpMethod.PUT, "/api/dealReport/resolve/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/dealReport/findByStatus/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/dealReport/getAll").hasRole("ADMIN")

                // Admin: send/delete notifications, view all notifications
                .requestMatchers(HttpMethod.POST, "/api/notification/create").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/notification/delete/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/notification/getAll").hasRole("ADMIN")

                // Admin: create/update/delete stores
                // Create/update/delete also accept store owners, who are authorization-checked
                // in StoreController against ownership of the store.
                .requestMatchers(HttpMethod.POST, "/api/stores").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/stores/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/stores/**").authenticated()

                // Admin: view all search history
                .requestMatchers(HttpMethod.GET, "/api/searchHistory/getAll").hasRole("ADMIN")

                // ----------------------------------------------------------------
                // Authenticated USER endpoints (any logged-in user)
                // ----------------------------------------------------------------

                // User profile self-management
                .requestMatchers(HttpMethod.GET, "/api/user/read/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/user/update/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/user/findByEmail/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/user/existsByEmail/**").authenticated()

                // Saved promotions (bookmark / unsave deals)
                .requestMatchers("/api/savedPromotion/**").authenticated()

                // Favourite stores
                .requestMatchers("/api/favoriteStore/**").authenticated()

                // Redemptions (claim & redeem deals at the store)
                .requestMatchers("/api/redemption/**").authenticated()

                // Deal reports (users can report a bad/expired deal)
                .requestMatchers(HttpMethod.POST, "/api/dealReport/create").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/dealReport/findByPromotionId/**").authenticated()

                // Reviews (write, edit, and delete own reviews)
                .requestMatchers(HttpMethod.POST, "/api/review/create").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/review/update/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/review/delete/**").authenticated()

                // Notifications (users read and mark their own notifications)
                .requestMatchers(HttpMethod.GET, "/api/notification/read/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/notification/findByUserId/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/notification/findUnreadByUserId/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/notification/update/**").authenticated()

                // Search history (personalised per user)
                .requestMatchers("/api/searchHistory/**").authenticated()

                // Store recommendations (personalised deal feed)
                .requestMatchers(HttpMethod.GET, "/api/stores/recommended/**").authenticated()

                // ----------------------------------------------------------------
                // Deny everything else by default
                // ----------------------------------------------------------------
                .anyRequest().authenticated() // permitAll()
        );

        return http.build();
    }

}
