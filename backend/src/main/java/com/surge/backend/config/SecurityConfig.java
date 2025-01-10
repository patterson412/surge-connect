package com.surge.backend.config;

import com.surge.backend.filter.JwtRequestFilter;
import com.surge.backend.security.JwtAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> {});
        http.authorizeHttpRequests(auth ->
                        auth
                                // Public endpoints - Auth Controller
                                .requestMatchers("/api/auth/**").permitAll()



                                // Have to add any other routes

                                // Any other request needs authentication
                                .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint)) // Use fallback custom entry point for auth errors if any exists after processing through all filters
                .securityContext((securityContext) -> securityContext
                        .requireExplicitSave(false))    // Configures Spring Security's filter chain to maintain security context across async request processing.
                // Spring Security will manage the context automatically and propagate it to threads as necessary,
                // including to any async tasks, if they are wrapped properly (like with DelegatingSecurityContextAsyncTaskExecutor).
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)); // Use stateless session policy for JWT

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class); // Add JWT filter before the standard auth filter

        http.csrf(csrf -> csrf.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Use BCrypt for password hashing // By default uses 10 rounds, can change by passing the number as parameter to the BCryptPasswordEncoder(12)
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager(); // Create AuthenticationManager instance
    }

    @Bean
    public AsyncTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize((Runtime.getRuntime().availableProcessors() * 2)); // Determines the number of threads that will be kept alive and ready for execution
        executor.setMaxPoolSize(((Runtime.getRuntime().availableProcessors() * 2) * 2));    // Used to accommodate increased demand when there is a sudden surge in tasks.
        // Determines how many tasks can wait in the queue before new threads are created.
        // A higher value reduces thread creation under load but increases memory usage.
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("csv-proc-"); // Makes it easier to identify these threads in logs/debugging.
        executor.setKeepAliveSeconds(60);   // allow idle threads to wait for 60 seconds before terminating
        executor.initialize();

        // Wrapping with DelegatingSecurityContextAsyncTaskExecutor ensures that the security context from the main thread is passed to any worker threads (such as those in a thread pool) that execute tasks asynchronously.
        return new DelegatingSecurityContextAsyncTaskExecutor(executor);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("*"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
