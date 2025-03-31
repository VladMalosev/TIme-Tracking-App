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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TimeLogService timeLogService;
    private final ProjectRepository projectRepository;
    private final TimeLogRepository timeLogRepository;
    private final TaskLogRepository taskLogRepository;
    private final ActivityRepository activityRepository;

    @Autowired
    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            TaskAssignmentRepository taskAssignmentRepository,
            TimeLogService timeLogService,
            ProjectRepository projectRepository,
            TimeLogRepository timeLogRepository,
            TaskLogRepository taskLogRepository, ActivityRepository activityRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.timeLogService = timeLogService;
        this.projectRepository = projectRepository;
        this.timeLogRepository = timeLogRepository;
        this.taskLogRepository = taskLogRepository;
        this.activityRepository = activityRepository;
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

        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new IllegalStateException("Cannot delete a completed task");
        }

        User currentUser = getCurrentUser();

        String taskName = task.getName();

        timeLogRepository.deleteByTaskId(taskId);
        taskLogRepository.deleteByTaskId(taskId);
        taskAssignmentRepository.deleteByTaskId(taskId);

        // Then delete the task
        taskRepository.delete(task);

        Activity activity = new Activity();
        activity.setProject(task.getProject());
        activity.setUser(currentUser);
        activity.setType(ActivityType.TASK_DELETED);
        activity.setDescription("Task '" + taskName + "' was deleted");
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);
    }


    public TaskCompletionDetails getTaskCompletionDetails(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User completedBy = task.getAssignedTo();

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

    public Task assignTask(UUID taskId, User assignee, User assigner) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new IllegalStateException("Cannot assign a completed task.");
        }

        task.setAssignedTo(assignee);
        task.setAssignedBy(assigner);
        task.setAssignedAt(LocalDateTime.now());
        task.setLastModifiedBy(assigner);

        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            task.setStatus(TaskStatus.ASSIGNED);
        }

        Task savedTask = taskRepository.save(task);

        logTaskAction(savedTask, TaskAction.ASSIGNED, assigner,
                "Assigned to " + assignee.getName() + " by " + assigner.getName());

        return savedTask;
    }

    public List<Task> getAssignedTasks(UUID userId) {
        return taskRepository.findByAssignedToId(userId);
    }




    public Task createTask(Task task, UUID projectId, User creator) {
        if (task.getDeadline() != null && task.getDeadline().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Deadline cannot be in the past");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        task.setProject(project);
        task.setCreatedBy(creator);
        task.setLastModifiedBy(creator);

        Task createdTask = taskRepository.save(task);
        logTaskAction(createdTask, TaskAction.CREATED, creator,
                "Task created by " + creator.getName());

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
        task.setLastModifiedBy(getCurrentUser());

        User currentUser = getCurrentUser();
        logTaskAction(task, TaskAction.STATUS_CHANGED, currentUser,
                "Status changed to " + taskStatus);

        if (task.getAssignedTo() != null) {
            UUID assignedUserId = task.getAssignedTo().getId();

            if (taskStatus == TaskStatus.IN_PROGRESS) {
                timeLogService.startTimer(assignedUserId, task.getProject().getId(), taskId, "Task started: " + task.getName());
            } else if (taskStatus == TaskStatus.COMPLETED) {
                if (timeLogService.hasActiveTimer(assignedUserId)) {
                    timeLogService.stopTimer(assignedUserId);
                } else {
                    logger.warn("No active timer found for taskId: {}", taskId);
                }
            }
        } else {
            logger.warn("Task {} has no assigned user, cannot start/stop timer", taskId);
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




    public List<Task> getUnassignedPendingTasks(UUID projectId) {
        return taskRepository.findByProjectIdAndStatusAndAssignedToIsNull(projectId, TaskStatus.PENDING);
    }

    @Transactional
    public Task updateTaskStatusWithValidation(UUID taskId, TaskStatus newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.getStatus() == TaskStatus.COMPLETED && newStatus != TaskStatus.REOPENED) {
            throw new IllegalStateException("Completed tasks can only be reopened");
        }

        if (task.getStatus() == TaskStatus.COMPLETED && newStatus == TaskStatus.REOPENED) {
            task.setStatus(newStatus);
            task.setLastModifiedBy(getCurrentUser());
            logTaskAction(task, TaskAction.REOPENED, getCurrentUser(), "Task reopened for additional work");
            return taskRepository.save(task);
        }

        return updateTaskStatus(taskId, newStatus.name());
    }

    public void ensureTaskStatusMatchesTimeLogs(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        boolean hasTimeLogs = timeLogRepository.existsByTaskId(taskId);

        if (hasTimeLogs && task.getStatus() == TaskStatus.PENDING) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            task.setLastModifiedBy(getCurrentUser());
            taskRepository.save(task);
            logTaskAction(task, TaskAction.STATUS_CHANGED, getCurrentUser(),
                    "Status automatically changed to IN_PROGRESS (first time log added)");
        } else if (!hasTimeLogs && task.getStatus() == TaskStatus.IN_PROGRESS) {
            task.setStatus(TaskStatus.PENDING);
            task.setLastModifiedBy(getCurrentUser());
            taskRepository.save(task);
            logTaskAction(task, TaskAction.STATUS_CHANGED, getCurrentUser(),
                    "Status reverted to PENDING (no time logs exist)");
        }
    }

    public List<Task> getIncompleteTasksByProject(UUID projectId) {
        return taskRepository.findByProjectIdAndStatusNot(projectId, TaskStatus.COMPLETED);
    }
}