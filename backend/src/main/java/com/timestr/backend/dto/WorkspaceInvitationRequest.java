package com.timestr.backend.dto;

import com.timestr.backend.model.Role;

public class WorkspaceInvitationRequest {
    private String email;
    private Role role;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}