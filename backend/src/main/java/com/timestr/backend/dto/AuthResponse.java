package com.timestr.backend.dto;

import lombok.Builder;

@Builder
public class AuthResponse {
    private String username;
    private String token;

    public void setUsername(String username) {
        this.username = username;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public String getToken() {
        return token;
    }


}
