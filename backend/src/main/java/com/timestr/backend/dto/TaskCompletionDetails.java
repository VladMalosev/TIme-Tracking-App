package com.timestr.backend.dto;

import com.timestr.backend.model.TimeLog;

import java.time.LocalDateTime;
import java.util.List;

public class TaskCompletionDetails {
    private String taskName;
    private String completedBy;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private long totalTimeSpent; // in minutes
    private List<TimeLog> timeLogs;

    // Constructor
    public TaskCompletionDetails(String taskName, String completedBy, LocalDateTime startedAt, LocalDateTime completedAt, long totalTimeSpent, List<TimeLog> timeLogs) {
        this.taskName = taskName;
        this.completedBy = completedBy;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.totalTimeSpent = totalTimeSpent;
        this.timeLogs = timeLogs;
    }

    // Getters and setters
    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getCompletedBy() {
        return completedBy;
    }

    public void setCompletedBy(String completedBy) {
        this.completedBy = completedBy;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public long getTotalTimeSpent() {
        return totalTimeSpent;
    }

    public void setTotalTimeSpent(long totalTimeSpent) {
        this.totalTimeSpent = totalTimeSpent;
    }

    public List<TimeLog> getTimeLogs() {
        return timeLogs;
    }

    public void setTimeLogs(List<TimeLog> timeLogs) {
        this.timeLogs = timeLogs;
    }
}