package com.timestr.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ProjectInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "invited_user_id", nullable = false)
    private User invitedUser;

    @Enumerated(EnumType.STRING)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private WorkspaceRole role; // Add this field to store the role

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void setId(Long id) {
        this.id = id;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setInvitedUser(User invitedUser) {
        this.invitedUser = invitedUser;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public void setRole(WorkspaceRole role) {
        this.role = role;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public User getInvitedUser() {
        return invitedUser;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public WorkspaceRole getRole() {
        return role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}