package com.timestr.backend.service;

import com.timestr.backend.dto.TaskCompletionDetails;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Duration;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TimeLogService timeLogService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;



    public Task updateTask(UUID taskId, Task updatedTask) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setName(updatedTask.getName());
        task.setDescription(updatedTask.getDescription());
        task.setStatus(updatedTask.getStatus());
        return taskRepository.save(task);
    }

    public void deleteTask(UUID taskId) {
        timeLogRepository.deleteByTaskId(taskId);
        taskAssignmentRepository.deleteByTaskId(taskId);
        taskRepository.deleteById(taskId);
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
        return taskRepository.save(task);
    }

    public List<Task> getAssignedTasks(UUID userId) {
        return taskRepository.findByAssignedUserId(userId);
    }

    public Task createTask(Task task, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setProject(project);

        return taskRepository.save(task);
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

        if (taskStatus == TaskStatus.IN_PROGRESS) {
            timeLogService.startTimer(task.getAssignedUserId(), "Task started: " + task.getName());
        } else if (taskStatus == TaskStatus.COMPLETED) {
            timeLogService.stopTimer(task.getAssignedUserId());
        }

        return taskRepository.save(task);
    }
}
