package com.timestr.backend.service;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TimeLog> generateTaskReport(UUID taskId, LocalDateTime startTime, LocalDateTime endTime) {
        return timeLogRepository.findByTaskIdAndLoggedAtBetween(taskId, startTime, endTime);
    }

    public List<TimeLog> generateProjectReport(UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        return timeLogRepository.findByTaskIdInAndLoggedAtBetween(
                tasks.stream().map(Task::getId).toList(), startTime, endTime);
    }

    public List<TimeLog> generateUserReport(UUID userId, LocalDateTime startTime, LocalDateTime endTime) {
        return timeLogRepository.findByUserIdAndLoggedAtBetween(userId, startTime, endTime);
    }
}