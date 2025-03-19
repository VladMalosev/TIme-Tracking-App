package com.timestr.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="activities")
public class Activity {

    @Id
    @UuidGenerator
    @Column(updatable=false, nullable = false)
    private UUID id;

    @ManyToOne
    @JoinColumn(name="project_id", nullable=false)
    private Project project;

    @Enumerated
    @Column(nullable = false)
    private ActivityType type;

    @Column(nullable = true)
    private String description;

    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public void setId(UUID id) {
        this.id = id;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setType(ActivityType type) {
        this.type = type;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public ActivityType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
