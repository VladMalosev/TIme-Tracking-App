package com.timestr.backend.controller;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TimeLog;
import com.timestr.backend.service.TaskService;
import com.timestr.backend.service.TimeLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timelogs")
@Tag(name = "Time Logs", description = "Endpoints for managing time logs")
public class TimeLogController {

    @Autowired
    private TimeLogService timeLogService;

    @Operation(summary = "Start a timer", description = "Starts a timer for a specific user and task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Timer started successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/start")
    public ResponseEntity<TimeLog> startTimer(
            @RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }
        String description = request.get("description");
        TimeLog timeLog = timeLogService.startTimer(userId, taskId, description);
        return ResponseEntity.ok(timeLog);
    }

    @Operation(summary = "Stop a timer", description = "Stops a timer for a specific user and task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Timer stopped successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/stop")
    public ResponseEntity<TimeLog> stopTimer(
            @RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }
        TimeLog timeLog = timeLogService.stopTimer(userId, taskId);
        return ResponseEntity.ok(timeLog);
    }

    @Operation(summary = "Create a manual time log", description = "Creates a manual time log for a specific user and task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Time log created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/manual")
    public ResponseEntity<TimeLog> createManualTimeLog(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");
        LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"), formatter);
        LocalDateTime endTime = LocalDateTime.parse(request.get("endTime"), formatter);

        String description = request.get("description");
        if (description == null) {
            description = "";
        }

        TimeLog timeLog = timeLogService.createManualTimeLog(userId, taskId, startTime, endTime, description);
        return ResponseEntity.ok(timeLog);
    }

    @Operation(summary = "Get time logs by user", description = "Retrieves all time logs for a specific user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Time logs retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TimeLog>> getTimeLogsByUser(@PathVariable UUID userId) {
        List<TimeLog> timeLogs = timeLogService.getTimeLogsByUser(userId);
        return ResponseEntity.ok(timeLogs);
    }
}
