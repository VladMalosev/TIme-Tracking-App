package com.timestr.backend.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class AppConfigurationProperties {
    private String secret;
    private long expiration;

    private final CookieProperties cookie = new CookieProperties();

    @Getter
    @Setter
    public static class CookieProperties {
        private String name;
        private int expiresIn;
    }
}
