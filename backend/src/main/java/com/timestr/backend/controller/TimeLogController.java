package com.timestr.backend.controller;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TimeLog;
import com.timestr.backend.service.TaskService;
import com.timestr.backend.service.TimeLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Time;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timelogs")
public class TimeLogController {

    @Autowired
    private TimeLogService timeLogService;

    @Autowired
    private TaskService taskService;


    @PostMapping("/start")
    public ResponseEntity<TimeLog> startTimer(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        String description = request.get("description");
        TimeLog timeLog = timeLogService.startTimer(userId, description);
        return ResponseEntity.ok(timeLog);
    }

    @PostMapping("/stop")
    public ResponseEntity<TimeLog> stopTimer(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        TimeLog timeLog = timeLogService.stopTimer(userId);
        return ResponseEntity.ok(timeLog);
    }

    @PostMapping("/manual")
    public ResponseEntity<TimeLog> createManualTimeLog(@RequestBody Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("userId"));
        LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"));
        LocalDateTime endTime = LocalDateTime.parse(request.get("endTime"));
        String description = request.get("description");
        TimeLog timeLog = timeLogService.createManualTimeLog(userId, startTime, endTime, description);
        return ResponseEntity.ok(timeLog);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TimeLog>> getTimeLogsByUser(@PathVariable UUID userId) {
        List<TimeLog> timeLogs = timeLogService.getTimeLogsByUser(userId);
        return ResponseEntity.ok(timeLogs);
    }

    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<Task>> getAssignedTasks(@PathVariable UUID userId) {
        List<Task> tasks = taskService.getAssignedTasks(userId);
        return ResponseEntity.ok(tasks);
    }
}
