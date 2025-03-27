package com.timestr.backend.controller;

import com.timestr.backend.dto.TaskCompletionDetails;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.ActivityRepository;
import com.timestr.backend.repository.TaskLogRepository;
import com.timestr.backend.repository.UserRepository;
import com.timestr.backend.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "Endpoints for managing tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private ActivityRepository activityRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TaskLogRepository taskLogRepository;

    @Operation(summary = "Update a task", description = "Updates an existing task with the provided details.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task updated successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(
            @Parameter(description = "ID of the task to update", required = true)
            @PathVariable UUID taskId,
            @RequestBody Task updatedTask) {
        Task task = taskService.updateTask(taskId, updatedTask);

        Activity activity = new Activity();
        activity.setProject(task.getProject());
        activity.setType(ActivityType.TASK_UPDATED);
        activity.setDescription("Task '" + task.getName() + "' was updated");
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Delete a task", description = "Deletes a task by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Task deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @Transactional
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "ID of the task to delete", required = true)
            @PathVariable UUID taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "Get a task by ID", description = "Retrieves a task by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{taskId}")
    public ResponseEntity<Task> getTask(
            @Parameter(description = "ID of the task to retrieve", required = true)
            @PathVariable UUID taskId) {
        Task task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Get tasks by project", description = "Retrieves all tasks associated with a specific project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId) {
        List<Task> tasks = taskService.getTaskByProject(projectId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Assign a task to a user", description = "Assigns a task to a specific user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task assigned successfully"),
            @ApiResponse(responseCode = "404", description = "Task or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{taskId}/assign")
    public ResponseEntity<Task> assignTask(
            @PathVariable UUID taskId,
            @RequestParam UUID userId,
            Authentication authentication) {

        String assignerEmail = authentication.getName();
        User assigner = userRepository.findByEmail(assignerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = taskService.assignTask(taskId, assignee, assigner);

        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Get assigned tasks by user", description = "Retrieves all tasks assigned to a specific user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<Task>> getAssignedTasks(
            @Parameter(description = "ID of the user", required = true)
            @PathVariable UUID userId) {
        List<Task> tasks = taskService.getAssignedTasks(userId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Create a new task", description = "Creates a new task associated with a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Task task,
            @RequestParam UUID projectId,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        task.setCreatedBy(user);
        task.setLastModifiedBy(user);
        Task createdTask = taskService.createTask(task, projectId, user);

        return ResponseEntity.ok(createdTask);
    }

    @Operation(summary = "Update task status", description = "Updates the status of a task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{taskId}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @Parameter(description = "ID of the task to update", required = true)
            @PathVariable UUID taskId,
            @Parameter(description = "New status of the task", required = true)
            @RequestParam String status,
            Authentication authentication) {

        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = taskService.updateTaskStatus(taskId, status);
        if (status.equalsIgnoreCase("COMPLETED")) {
            Activity activity = new Activity();
            activity.setProject(task.getProject());
            activity.setType(ActivityType.TASK_COMPLETED);
            activity.setDescription("Task '" + task.getName() + "' was completed");
            activity.setCreatedAt(LocalDateTime.now());
            activity.setUser(user);
            activityRepository.save(activity);
        }
        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Get task completion details", description = "Retrieves completion details for a specific task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Completion details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{taskId}/completion-details")
    public ResponseEntity<TaskCompletionDetails> getTaskCompletionDetails(
            @Parameter(description = "ID of the task", required = true)
            @PathVariable UUID taskId) {
        TaskCompletionDetails details = taskService.getTaskCompletionDetails(taskId);
        return ResponseEntity.ok(details);
    }


    @Operation(summary = "Get task logs", description = "Retrieves all logs for a specific task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logs retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{taskId}/logs")
    public ResponseEntity<List<TaskLog>> getTaskLogs(
            @Parameter(description = "ID of the task", required = true)
            @PathVariable UUID taskId) {
        taskService.getTaskById(taskId);

        List<TaskLog> logs = taskService.getTaskLogs(taskId);
        return ResponseEntity.ok(logs);
    }




    @Operation(summary = "Get unassigned pending tasks", description = "Retrieves all tasks that are unassigned and have PENDING status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/unassigned-pending/{projectId}")
    public ResponseEntity<List<Task>> getUnassignedPendingTasks(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId) {
        List<Task> tasks = taskService.getUnassignedPendingTasks(projectId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Reopen completed task", description = "Reopens a completed task to allow adding more time logs")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task reopened successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status transition"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{taskId}/reopen")
    public ResponseEntity<Task> reopenTask(
            @Parameter(description = "ID of the task to reopen", required = true)
            @PathVariable UUID taskId) {
        Task task = taskService.updateTaskStatusWithValidation(taskId, TaskStatus.REOPENED);
        return ResponseEntity.ok(task);
    }

}