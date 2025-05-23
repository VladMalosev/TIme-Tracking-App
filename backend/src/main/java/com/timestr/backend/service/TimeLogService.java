package com.timestr.backend.service;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.ProjectRepository;
import com.timestr.backend.repository.TaskRepository;
import com.timestr.backend.repository.TimeLogRepository;
import com.timestr.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TimeLogService {
    private final TimeLogRepository timeLogRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @Autowired
    public TimeLogService(TimeLogRepository timeLogRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          ProjectRepository projectRepository) {
        this.timeLogRepository = timeLogRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    public TimeLog startTimer(UUID userId, UUID projectId, UUID taskId, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Check for existing active timer
        if (hasActiveTimer(userId)) {
            throw new IllegalStateException("User already has an active timer");
        }

        TimeLog timeLog = new TimeLog();
        timeLog.setUser(user);
        timeLog.setProject(project);

        if (taskId != null) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            timeLog.setTask(task);

            if (task.getStatus() == TaskStatus.PENDING || task.getStatus() == TaskStatus.ASSIGNED) {
                task.setStatus(TaskStatus.IN_PROGRESS);
                taskRepository.save(task);
            }
        }


        timeLog.setStartTime(LocalDateTime.now());
        timeLog.setDescription(description != null ? description : "");
        return timeLogRepository.save(timeLog);
    }

    @Transactional
    public TimeLog stopTimer(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeLog timeLog = timeLogRepository.findFirstByUserAndEndTimeIsNullOrderByStartTimeDesc(user)
                .orElseThrow(() -> new RuntimeException("No active timer found"));

        if (Duration.between(timeLog.getStartTime(), LocalDateTime.now()).toHours() > 24) {
            timeLogRepository.delete(timeLog);
            throw new IllegalStateException("Old active timer was cleaned up");
        }

        timeLog.setEndTime(LocalDateTime.now());
        long minutes = Duration.between(timeLog.getStartTime(), timeLog.getEndTime()).toMinutes();
        timeLog.setMinutes((int) minutes);
        return timeLogRepository.save(timeLog);
    }


    public TimeLog createManualTimeLog(UUID userId, UUID projectId, UUID taskId,
                                       LocalDateTime startTime, LocalDateTime endTime,
                                       String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = null;
        if (projectId != null) {
            project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
        }

        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        TimeLog timeLog = new TimeLog();
        timeLog.setUser(user);
        timeLog.setProject(project);

        if (taskId != null) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            timeLog.setTask(task);

            if (task.getStatus() == TaskStatus.PENDING || task.getStatus() == TaskStatus.ASSIGNED) {
                task.setStatus(TaskStatus.IN_PROGRESS);
                taskRepository.save(task);
            }
        }

        timeLog.setStartTime(startTime);
        timeLog.setEndTime(endTime);
        long minutes = Duration.between(startTime, endTime).toMinutes();
        timeLog.setMinutes((int) minutes);
        timeLog.setDescription(description != null ? description : "");

        return timeLogRepository.save(timeLog);
    }

    public boolean hasActiveTimer(UUID userId) {
        return timeLogRepository.existsByUserAndEndTimeIsNull(
                userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"))
        );
    }

    public List<TimeLog> getTimeLogsByUser(UUID userId) {
        return timeLogRepository.findByUserId(userId);
    }

    public List<TimeLog> getTimeLogsByProject(UUID projectId) {
        return timeLogRepository.findByProjectId(projectId);
    }

    public List<TimeLog> getTimeLogsByTask(UUID taskId) {
        return timeLogRepository.findByTaskId(taskId);
    }

    public List<TimeLog> getGeneralTimeLogs(UUID userId) {
        return timeLogRepository.findByUserIdAndProjectIsNull(userId);
    }

    public List<TimeLog> getTimeLogsByProjectAndUser(UUID projectId, UUID userId) {
        return timeLogRepository.findByProjectIdAndUserIdOrderByStartTimeDesc(projectId, userId);
    }

    @Transactional
    public TimeLog linkTimeLogToTask(UUID timeLogId, UUID taskId) {
        TimeLog timeLog = timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new EntityNotFoundException("Time log not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        timeLog.setTask(task);

        return timeLogRepository.save(timeLog);
    }

    public TimeLog getTimeLogById(UUID timeLogId) {
        return timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new EntityNotFoundException("Time log not found"));
    }

    public TimeLog getActiveTimeLog(UUID userId, UUID taskId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (taskId != null) {
            return timeLogRepository.findByUserAndTaskIdAndEndTimeIsNull(user, taskId)
                    .orElse(null);
        } else {
            return timeLogRepository.findFirstByUserAndEndTimeIsNullOrderByStartTimeDesc(user)
                    .orElse(null);
        }
    }

    public TimeLog getActiveProjectTimeLog(UUID userId, UUID projectId) {
        return timeLogRepository.findByUserIdAndProjectIdAndEndTimeIsNull(userId, projectId)
                .orElse(null);
    }

    @Transactional
    public TimeLog updateTimerHeartbeat(UUID userId, UUID projectId) {
        TimeLog activeTimer = getActiveProjectTimeLog(userId, projectId);
        if (activeTimer != null) {
            activeTimer.updateHeartbeat();
            return timeLogRepository.save(activeTimer);
        }
        return null;
    }

    public long calculateCurrentDuration(TimeLog timeLog) {
        if (timeLog.getEndTime() != null) {
            return ChronoUnit.SECONDS.between(timeLog.getStartTime(), timeLog.getEndTime());
        }
        return ChronoUnit.SECONDS.between(timeLog.getStartTime(),
                timeLog.getLastHeartbeat() != null ?
                        timeLog.getLastHeartbeat() :
                        LocalDateTime.now());
    }


    @Transactional
    public TimeLog checkAndCleanActiveProjectTimer(UUID userId, UUID projectId) {
        Optional<TimeLog> activeTimerOpt = timeLogRepository.findByUserIdAndProjectIdAndEndTimeIsNull(userId, projectId);

        if (!activeTimerOpt.isPresent()) {
            return null;
        }

        TimeLog activeTimer = activeTimerOpt.get();

        if (activeTimer.getLastHeartbeat() == null ||
                activeTimer.getLastHeartbeat().isBefore(LocalDateTime.now().minusMinutes(5))) {

            LocalDateTime endTime = activeTimer.getLastHeartbeat() != null ?
                    activeTimer.getLastHeartbeat() :
                    LocalDateTime.now();

            activeTimer.setEndTime(endTime);
            activeTimer.setDescription("Automatically closed stale timer");
            return timeLogRepository.save(activeTimer);
        }

        return activeTimer;
    }


    @Transactional
    public TimeLog stopSpecificTimer(UUID timeLogId, UUID userId) {
        TimeLog timeLog = timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new EntityNotFoundException("Time log not found"));

        if (!timeLog.getUser().getId().equals(userId)) {
            throw new SecurityException("Cannot stop another user's timer");
        }

        if (timeLog.getEndTime() != null) {
            throw new IllegalStateException("Timer is already stopped");
        }

        timeLog.setEndTime(LocalDateTime.now());
        long minutes = Duration.between(timeLog.getStartTime(), timeLog.getEndTime()).toMinutes();
        timeLog.setMinutes((int) minutes);

        return timeLogRepository.save(timeLog);
    }
}
