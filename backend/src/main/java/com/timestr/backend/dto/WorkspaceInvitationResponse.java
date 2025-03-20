package com.timestr.backend.dto;

import com.timestr.backend.model.InvitationStatus;
import com.timestr.backend.model.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public class WorkspaceInvitationResponse {
    private UUID id;
    private String invitedUserEmail;
    private String invitedUserName;
    private Role role;
    private InvitationStatus status;
    private LocalDateTime createdAt;
    private String senderEmail;

    public WorkspaceInvitationResponse(UUID id, String invitedUserEmail, String invitedUserName, Role role, InvitationStatus status, LocalDateTime createdAt, String senderEmail) {
        this.id = id;
        this.invitedUserEmail = invitedUserEmail;
        this.invitedUserName = invitedUserName;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
        this.senderEmail = senderEmail;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getInvitedUserEmail() {
        return invitedUserEmail;
    }

    public void setInvitedUserEmail(String invitedUserEmail) {
        this.invitedUserEmail = invitedUserEmail;
    }

    public String getInvitedUserName() {
        return invitedUserName;
    }

    public void setInvitedUserName(String invitedUserName) {
        this.invitedUserName = invitedUserName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }
}