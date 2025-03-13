package com.timestr.backend.dto;

import com.timestr.backend.model.TaskStatus;
import com.timestr.backend.model.TimeLog;

public class TimeLogWithStatus {
    private TimeLog timeLog;
    private TaskStatus status;

    public TimeLogWithStatus(TimeLog timeLog, TaskStatus status) {
        this.timeLog = timeLog;
        this.status = status;
    }

    public TimeLog getTimeLog() {
        return timeLog;
    }

    public TaskStatus getStatus() {
        return status;
    }
}