package com.timestr.backend.model;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.Set;

public enum Role {
    ADMIN,
    USER,
    MANAGER;

    public Set<SimpleGrantedAuthority> getAuthorities() {
        switch (this) {
            case ADMIN:
                return Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN"));
            case USER:
                return Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"));
            case MANAGER:
                return Collections.singleton(new SimpleGrantedAuthority("ROLE_MANAGER"));
            default:
                return Collections.emptySet();
        }
    }
}
