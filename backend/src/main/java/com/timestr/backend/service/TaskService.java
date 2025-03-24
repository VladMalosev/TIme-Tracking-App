package com.timestr.backend.service;

import com.timestr.backend.dto.TaskCompletionDetails;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.Duration;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TimeLogService timeLogService;
    private final ProjectRepository projectRepository;
    private final TimeLogRepository timeLogRepository;
    private final TaskLogRepository taskLogRepository;

    @Autowired
    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            TaskAssignmentRepository taskAssignmentRepository,
            TimeLogService timeLogService,
            ProjectRepository projectRepository,
            TimeLogRepository timeLogRepository,
            TaskLogRepository taskLogRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.timeLogService = timeLogService;
        this.projectRepository = projectRepository;
        this.timeLogRepository = timeLogRepository;
        this.taskLogRepository = taskLogRepository;
    }


    private void logTaskAction(Task task, TaskAction action, User user, String details) {
        TaskLog log = new TaskLog();
        log.setTask(task);
        log.setUser(user);
        log.setAction(action);
        log.setDetails(details);
        taskLogRepository.save(log);
    }

    private static final Logger logger = LoggerFactory.getLogger(TimeLogService.class);

    public Task updateTask(UUID taskId, Task updatedTask) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User currentUser = getCurrentUser();

        task.setName(updatedTask.getName());
        task.setDescription(updatedTask.getDescription());
        task.setStatus(updatedTask.getStatus());
        task.setLastModifiedBy(currentUser);

        Task savedTask = taskRepository.save(task);

        logTaskAction(savedTask, TaskAction.UPDATED, currentUser,
                "Task details updated");
        return savedTask;
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User currentUser = getCurrentUser();
        logTaskAction(task, TaskAction.DELETED, currentUser,
                "Task deleted");

        timeLogRepository.deleteByTaskId(taskId);
        taskAssignmentRepository.deleteByTaskId(taskId);
        taskRepository.delete(task);
    }

    public TaskCompletionDetails getTaskCompletionDetails(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User completedBy = userRepository.findById(task.getAssignedUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<TimeLog> timeLogs = timeLogRepository.findByTaskId(taskId);

        long totalTimeSpent = timeLogs.stream()
                .filter(log -> log.getStartTime() != null && log.getEndTime() != null)
                .mapToLong(log -> Duration.between(log.getStartTime(), log.getEndTime()).toMinutes())
                .sum();

        return new TaskCompletionDetails(
                task.getName(),
                completedBy.getName(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                totalTimeSpent,
                timeLogs
        );
    }

    public Task getTaskById(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public List<Task> getTaskByProject(UUID projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    public Task assignTask(UUID taskId, UUID userId, UUID assignedBy) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User assigner = userRepository.findById(assignedBy)
                .orElseThrow(() -> new RuntimeException("Assigner not found"));

        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new IllegalStateException("Cannot assign a completed task.");
        }

        task.setAssignedUserId(userId);

        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setUser(user);
        assignment.setAssignedBy(assigner);
        taskAssignmentRepository.save(assignment);

        Task savedTask = taskRepository.save(task);
        logTaskAction(savedTask, TaskAction.ASSIGNED, assigner,
                "Assigned to " + user.getName());
        return savedTask;
    }

    public List<Task> getAssignedTasks(UUID userId) {
        return taskRepository.findByAssignedUserId(userId);
    }




    public Task createTask(Task task, UUID projectId, User creator) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        task.setProject(project);
        task.setCreatedBy(creator);

        Task createdTask = taskRepository.save(task);

        logTaskAction(createdTask, TaskAction.CREATED, creator, "Task created");
        return createdTask;
    }

    public Task updateTaskStatus(UUID taskId, String status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        TaskStatus taskStatus;
        try {
            taskStatus = TaskStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        task.setStatus(taskStatus);

        User currentUser = getCurrentUser();
        logTaskAction(task, TaskAction.STATUS_CHANGED, currentUser,
                "Status changed to " + taskStatus);

        if (taskStatus == TaskStatus.IN_PROGRESS) {
            timeLogService.startTimer(task.getAssignedUserId(), taskId, "Task started: " + task.getName());
        } else if (taskStatus == TaskStatus.COMPLETED) {
            if (timeLogService.hasActiveTimer(task.getAssignedUserId(), taskId)) {
                timeLogService.stopTimer(task.getAssignedUserId(), taskId);
            } else {
                logger.warn("No active timer found for taskId: {}", taskId);
            }
        }

        return taskRepository.save(task);
    }

    public void updateTaskStatusIfTimeLogExists(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (timeLogRepository.existsByTaskId(taskId) && task.getStatus() != TaskStatus.IN_PROGRESS) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            taskRepository.save(task);
        }
    }
    public List<TaskLog> getTaskLogs(UUID taskId) {
        return taskLogRepository.findByTaskIdOrderByTimestampDesc(taskId);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}