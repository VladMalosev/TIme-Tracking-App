package com.timestr.backend.service;

import com.timestr.backend.dto.TimeLogWithStatus;
import com.timestr.backend.model.TimeLog;
import com.timestr.backend.model.TaskStatus;
import com.timestr.backend.model.User;
import com.timestr.backend.repository.TaskRepository;
import com.timestr.backend.repository.TimeLogRepository;
import com.timestr.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TimeLogWithStatus> generateTaskReport(UUID taskId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByTaskId(taskId);
        } else {
            timeLogs = timeLogRepository.findByTaskIdAndLoggedAtBetween(taskId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(taskId).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateProjectReport(UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByProjectId(projectId);
        } else {
            timeLogs = timeLogRepository.findByProjectIdAndLoggedAtBetween(projectId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateUserReport(UUID userId, UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByUserIdAndProjectId(userId, projectId);
        } else {
            timeLogs = timeLogRepository.findByUserIdAndProjectIdAndLoggedAtBetween(userId, projectId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateUserTimeLogsReport(LocalDateTime startTime, LocalDateTime endTime) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UUID userId = user.getId();

        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByUserId(userId);
        } else {
            timeLogs = timeLogRepository.findByUserIdAndLoggedAtBetween(userId, startTime, endTime);
        }

        return timeLogs.stream()
                .map(timeLog -> {
                    TaskStatus status = timeLog.getTask() != null
                            ? taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()
                            : TaskStatus.PENDING;
                    return new TimeLogWithStatus(timeLog, status);
                })
                .collect(Collectors.toList());
    }
}