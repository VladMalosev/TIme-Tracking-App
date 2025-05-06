package com.timestr.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.logging.Logger;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = Logger.getLogger(SecurityConfig.class.getName());

    private final JwtTokenProvider jwtTokenProvider;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> oAuth2UserService;

    @Value("${allowed.email}")  // Inject the value from application.properties
    private String allowedEmail;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider, OAuth2UserService<OAuth2UserRequest, OAuth2User> oAuth2UserService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.oAuth2UserService = oAuth2UserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login",  "/oauth2/**", "/api/auth/logout").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").authenticated() // Allow access to Swagger UI and API docs
                        .requestMatchers("/ws/**", "/api/reports/**").permitAll()
                        .requestMatchers("/api/clients/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .requestMatchers("/api/workspaces/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .requestMatchers("/api/projects/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .requestMatchers("/api/tasks/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .requestMatchers("/api/timelogs/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .requestMatchers("/api/tasks/assign").hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers("/api/reports/**").hasAuthority("REPORT_GENERATE")
                        .requestMatchers("/api/tasks/assigned/**").hasAnyRole("ADMIN", "MANAGER", "USER")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/api/auth/login")
                        .defaultSuccessUrl("http://localhost:4200/dashboard")
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oAuth2UserService)
                        )
                )
                .addFilterBefore(jwtAuthenticationFilter(http), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new SwaggerAccessFilter(jwtTokenProvider, allowedEmail), JwtAuthenticationFilter.class)
                .build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(HttpSecurity http) throws Exception {
        logger.info("Configuring JwtAuthenticationFilter");
        return new JwtAuthenticationFilter(authenticationManager(http), jwtTokenProvider);
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        logger.info("Configuring AuthenticationManager");
        return http.getSharedObject(AuthenticationManagerBuilder.class).build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    }
