package com.timestr.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "project_workers")

public class ProjectWorker {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User worker;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public void setId(UUID id) {
        this.id = id;
    }

    public void setWorker(User worker) {
        this.worker = worker;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public UUID getId() {
        return id;
    }

    public User getWorker() {
        return worker;
    }

    public Project getProject() {
        return project;
    }
}