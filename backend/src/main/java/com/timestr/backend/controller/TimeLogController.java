package com.timestr.backend.controller;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TimeLog;
import com.timestr.backend.service.TaskService;
import com.timestr.backend.service.TimeLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timelogs")
public class TimeLogController {

    @Autowired
    private TimeLogService timeLogService;

    @PostMapping("/start")
    public ResponseEntity<TimeLog> startTimer(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }
        String description = request.get("description");
        TimeLog timeLog = timeLogService.startTimer(userId, taskId, description);
        return ResponseEntity.ok(timeLog);
    }

    @PostMapping("/stop")
    public ResponseEntity<TimeLog> stopTimer(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }
        TimeLog timeLog = timeLogService.stopTimer(userId, taskId);
        return ResponseEntity.ok(timeLog);
    }

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

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TimeLog>> getTimeLogsByUser(@PathVariable UUID userId) {
        List<TimeLog> timeLogs = timeLogService.getTimeLogsByUser(userId);
        return ResponseEntity.ok(timeLogs);
    }
}