package com.timestr.backend.controller;

import com.timestr.backend.dto.TaskCompletionDetails;
import com.timestr.backend.model.Task;
import com.timestr.backend.service.TaskService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(@PathVariable UUID taskId, @RequestBody Task updatedTask) {
        Task task = taskService.updateTask(taskId, updatedTask);
        return ResponseEntity.ok(task);
    }

    @Transactional
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<Task> getTask(@PathVariable UUID taskId) {
        Task task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable UUID projectId) {
        List<Task> tasks = taskService.getTaskByProject(projectId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/{taskId}/assign")
    public ResponseEntity<Task> assignTask(
            @PathVariable UUID taskId,
            @RequestParam UUID userId,
            @RequestParam UUID assignedBy) {
        Task task = taskService.assignTask(taskId, userId, assignedBy);
        System.out.println("Assigned Task: " + task);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<Task>> getAssignedTasks(@PathVariable UUID userId) {
        List<Task> tasks = taskService.getAssignedTasks(userId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task, @RequestParam UUID projectId) {
        Task createdTask = taskService.createTask(task, projectId);
        return ResponseEntity.ok(createdTask);
    }
    @PutMapping("/{taskId}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable UUID taskId,
            @RequestParam String status) {
        Task task = taskService.updateTaskStatus(taskId, status);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/{taskId}/completion-details")
    public ResponseEntity<TaskCompletionDetails> getTaskCompletionDetails(@PathVariable UUID taskId) {
        TaskCompletionDetails details = taskService.getTaskCompletionDetails(taskId);
        return ResponseEntity.ok(details);
    }


}