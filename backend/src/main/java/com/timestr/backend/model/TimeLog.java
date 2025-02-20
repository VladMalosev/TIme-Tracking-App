package com.timestr.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "time_logs")

public class TimeLog {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    private int hours;

    @Column(length = 500)
    private String description;

    private LocalDateTime loggedAt = LocalDateTime.now();

    public void setId(UUID id) {
        this.id = id;
    }

    public void setWorker(User worker) {
        this.worker = worker;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public void setHours(int hours) {
        this.hours = hours;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }

    public UUID getId() {
        return id;
    }

    public User getWorker() {
        return worker;
    }

    public Task getTask() {
        return task;
    }

    public int getHours() {
        return hours;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }
}