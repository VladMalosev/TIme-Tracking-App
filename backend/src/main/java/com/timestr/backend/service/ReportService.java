package com.timestr.backend.service;

import com.timestr.backend.model.TimeLog;
import com.timestr.backend.repository.TaskRepository;
import com.timestr.backend.repository.TimeLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    public List<TimeLog> generateTaskReport(UUID taskId, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return timeLogRepository.findByTaskId(taskId);
        }
        return timeLogRepository.findByTaskIdAndLoggedAtBetween(taskId, startTime, endTime);
    }

    public List<TimeLog> generateProjectReport(UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return timeLogRepository.findByProjectId(projectId);
        }
        return timeLogRepository.findByProjectIdAndLoggedAtBetween(projectId, startTime, endTime);
    }

    public List<TimeLog> generateUserReport(UUID userId, UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return timeLogRepository.findByUserIdAndProjectId(userId, projectId);
        }
        return timeLogRepository.findByUserIdAndProjectIdAndLoggedAtBetween(userId, projectId, startTime, endTime);
    }
}