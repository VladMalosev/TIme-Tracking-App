package com.timestr.backend.controller;

import com.thoughtworks.qdox.JavaProjectBuilder;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import com.timestr.backend.service.TaskService;
import com.timestr.backend.service.TimeLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timelogs")
@Tag(name = "Time Logs", description = "Endpoints for managing time logs")
public class TimeLogController {

    @Autowired
    private TimeLogService timeLogService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Operation(summary = "Start a timer", description = "Starts a timer for a specific user and task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Timer started successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/start")
    public ResponseEntity<TimeLog> startTimer(@RequestBody Map<String, String> request) {
        if (!request.containsKey("userId") || !request.containsKey("projectId")) {
            throw new IllegalArgumentException("userId and projectId are required");
        }

        UUID userId = UUID.fromString(request.get("userId"));
        UUID projectId = UUID.fromString(request.get("projectId"));

        UUID taskId = null;
        if (request.containsKey("taskId") && request.get("taskId") != null) {
            taskId = UUID.fromString(request.get("taskId"));
        }

        String description = request.get("description");

        TimeLog timeLog = timeLogService.startTimer(userId, projectId, taskId, description);
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
        TimeLog timeLog = timeLogService.stopTimer(userId);
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
        UUID projectId = UUID.fromString(request.get("projectId"));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");
        LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"), formatter);
        LocalDateTime endTime = LocalDateTime.parse(request.get("endTime"), formatter);

        String description = request.get("description");
        if (description == null) {
            description = "";
        }

        TimeLog timeLog = timeLogService.createManualTimeLog(userId, projectId, taskId, startTime, endTime, description);
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

    @Operation(summary = "Get time logs by task", description = "Retrieves all time logs for a specific task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Time logs retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Task not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TimeLog>> getTimeLogsByTask(
            @Parameter(description = "ID of the task", required = true)
            @PathVariable UUID taskId) {

        List<TimeLog> timeLogs = timeLogService.getTimeLogsByTask(taskId);
        return ResponseEntity.ok(timeLogs);
    }

    @Operation(summary = "Get time logs by project and user",
            description = "Retrieves all time logs for a specific project and user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Time logs retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/project/{projectId}/user/{userId}")
    public ResponseEntity<List<TimeLog>> getTimeLogsByProjectAndUser(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId,
            @Parameter(description = "ID of the user", required = true)
            @PathVariable UUID userId) {

        List<TimeLog> timeLogs = timeLogService.getTimeLogsByProjectAndUser(projectId, userId);
        return ResponseEntity.ok(timeLogs);
    }

    @PutMapping("/{timeLogId}/link-task")
    public ResponseEntity<TimeLog> linkTimeLogToTask(
            @Parameter(description = "ID of the time log to link", required = true)
            @PathVariable UUID timeLogId,
            @Parameter(description = "ID of the task to link to", required = true)
            @RequestParam UUID taskId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID userId = user.getId();

        Task task = taskService.getTaskById(taskId);
        if (!task.getAssignedTo().getId().equals(userId)) {
            throw new SecurityException("User is not assigned to this task");
        }

        TimeLog timeLog = timeLogService.getTimeLogById(timeLogId);
        if (!timeLog.getProject().getId().equals(task.getProject().getId())) {
            throw new IllegalArgumentException("Time log and task must belong to the same project");
        }

        if (timeLog.getTask() != null) {
            throw new IllegalStateException("Time log is already linked to a task");
        }

        TimeLog updatedTimeLog = timeLogService.linkTimeLogToTask(timeLogId, taskId);

        Activity activity = new Activity();
        activity.setProject(task.getProject());
        activity.setType(ActivityType.TIME_LOG_LINKED);
        activity.setDescription(String.format(
                "Time log from %s linked to task '%s'",
                timeLog.getStartTime().format(DateTimeFormatter.ISO_LOCAL_DATE),
                task.getName()
        ));
        activity.setCreatedAt(LocalDateTime.now());
        activity.setUser(user);
        activityRepository.save(activity);

        return ResponseEntity.ok(updatedTimeLog);
    }

    @Operation(summary = "Update time log description", description = "Updates the description of a time log")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Description updated successfully"),
            @ApiResponse(responseCode = "404", description = "Time log not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{timeLogId}/description")
    public ResponseEntity<TimeLog> updateTimeLogDescription(
            @PathVariable UUID timeLogId,
            @RequestBody Map<String, String> request) {

        String description = request.get("description");
        if (description == null) {
            throw new IllegalArgumentException("Description is required");
        }

        TimeLog timeLog = timeLogService.getTimeLogById(timeLogId);
        timeLog.setDescription(description);
        TimeLog updatedTimeLog = timeLogRepository.save(timeLog);

        return ResponseEntity.ok(updatedTimeLog);
    }

    @Operation(summary = "Delete stale time log", description = "Deletes a stale time log")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Time log deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Time log not found")
    })
    @DeleteMapping("/{timeLogId}")
    public ResponseEntity<Void> deleteTimeLog(@PathVariable UUID timeLogId) {
        TimeLog timeLog = timeLogService.getTimeLogById(timeLogId);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!timeLog.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Cannot delete another user's time log");
        }

        timeLogRepository.delete(timeLog);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserTimeStats(
            @PathVariable UUID userId,
            @RequestParam(required = false) UUID projectId) {

        Long totalMinutes = timeLogRepository.sumMinutesByUserAndProject(userId, projectId);
        Long weeklyAverage = calculateWeeklyAverage(totalMinutes);

        List<Map<String, Object>> taskDistribution = timeLogRepository.getTaskTimeDistribution(userId, projectId);

        Map<String, Object> response = new HashMap<>();
        response.put("totalLogged", totalMinutes != null ? totalMinutes : 0);
        response.put("weeklyAverage", weeklyAverage != null ? weeklyAverage : 0);
        response.put("taskDistribution", taskDistribution);

        return ResponseEntity.ok(response);
    }

    private Long calculateWeeklyAverage(Long totalMinutes) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID userId = user.getId();


        if (totalMinutes == null || totalMinutes == 0) {
            return 0L;
        }

        LocalDateTime firstLogDate = timeLogRepository.findFirstLogDateByUser(userId);
        if (firstLogDate == null) {
            return 0L;
        }

        long weeksBetween = ChronoUnit.WEEKS.between(firstLogDate, LocalDateTime.now());
        if (weeksBetween == 0) {
            weeksBetween = 1;
        }

        return totalMinutes / weeksBetween;
    }

    @Operation(summary = "Get active time log", description = "Retrieves the active time log for a specific user and task")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active time log retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No active time log found")
    })
    @GetMapping("/active")
    public ResponseEntity<?> getActiveTimeLog(
            @RequestParam UUID userId,
            @RequestParam(required = false) UUID taskId) {

        TimeLog activeTimeLog = timeLogService.getActiveTimeLog(userId, taskId);
        if (activeTimeLog == null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok(activeTimeLog);
    }

    @Operation(summary = "Get active time log for project",
            description = "Retrieves the active time log for a specific user and project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active time log retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No active time log found")
    })
    @GetMapping("/active/project/{projectId}")
    public ResponseEntity<?> getActiveProjectTimeLog(
            @PathVariable UUID projectId,
            @RequestParam UUID userId) {

        TimeLog activeTimeLog = timeLogService.getActiveProjectTimeLog(userId, projectId);
        if (activeTimeLog == null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok(activeTimeLog);
    }

    @Operation(summary = "Update timer heartbeat",
            description = "Updates the last active time for a running timer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Heartbeat updated"),
            @ApiResponse(responseCode = "404", description = "No active timer found")
    })
    @PostMapping("/heartbeat")
    public ResponseEntity<Void> updateTimerHeartbeat(
            @RequestParam UUID userId,
            @RequestParam(required = false) UUID projectId) {

        timeLogService.updateTimerHeartbeat(userId, projectId);
        return ResponseEntity.ok().build();
    }


    @Operation(summary = "Get timer duration",
            description = "Gets the current duration of an active timer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Duration retrieved"),
            @ApiResponse(responseCode = "404", description = "No active timer found")
    })
    @GetMapping("/duration")
    public ResponseEntity<Long> getTimerDuration(
            @RequestParam UUID userId,
            @RequestParam(required = false) UUID projectId) {

        TimeLog activeTimer = timeLogService.getActiveProjectTimeLog(userId, projectId);
        if (activeTimer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(timeLogService.calculateCurrentDuration(activeTimer));
    }


    @Operation(summary = "Get time log statistics for user in project",
            description = "Retrieves time log statistics for a specific user in a specific project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User or project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/project/{projectId}/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getTimeLogStatsForUserInProject(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId,
            @Parameter(description = "ID of the user", required = true)
            @PathVariable UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Long totalMinutes = timeLogRepository.sumMinutesByUserAndProject(userId, projectId);
        Long weeklyAverage = calculateWeeklyAverage(totalMinutes);

        List<Map<String, Object>> taskDistribution = timeLogRepository.getTaskTimeDistribution(userId, projectId);

        Map<String, Object> response = new HashMap<>();
        response.put("totalLogged", totalMinutes != null ? totalMinutes : 0);
        response.put("weeklyAverage", weeklyAverage != null ? weeklyAverage : 0);
        response.put("taskDistribution", taskDistribution);

        return ResponseEntity.ok(response);
    }


    @Operation(summary = "Get all active timers for user",
            description = "Retrieves all active timers for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active timers retrieved"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/active/user/{userId}")
    public ResponseEntity<List<TimeLog>> getAllActiveTimersForUser(@PathVariable UUID userId) {
        List<TimeLog> activeTimers = timeLogRepository.findByUserIdAndEndTimeIsNull(userId);
        return ResponseEntity.ok(activeTimers);
    }

    @Operation(summary = "Stop specific timer",
            description = "Stops a specific timer by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Timer stopped"),
            @ApiResponse(responseCode = "404", description = "Timer not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - cannot stop another user's timer")
    })
    @PostMapping("/{timeLogId}/stop")
    public ResponseEntity<TimeLog> stopSpecificTimer(
            @PathVariable UUID timeLogId,
            @RequestBody Map<String, String> request) {

        UUID userId = UUID.fromString(request.get("userId"));
        TimeLog stoppedTimer = timeLogService.stopSpecificTimer(timeLogId, userId);
        return ResponseEntity.ok(stoppedTimer);
    }

    @Operation(summary = "Export time logs for project",
            description = "Exports all time logs for a project grouped by task and user")
    @GetMapping("/project/{projectId}/export")
    public ResponseEntity<List<Map<String, Object>>> exportTimeLogs(
            @PathVariable UUID projectId) {

        projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<TimeLog> timeLogs = timeLogRepository.findByProjectId(projectId);

        Map<UUID, Map<UUID, List<TimeLog>>> groupedLogs = timeLogs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getTask() != null ? log.getTask().getId() : null,
                        Collectors.groupingBy(log -> log.getUser().getId())
                ));

        List<Map<String, Object>> result = new ArrayList<>();

        groupedLogs.entrySet().stream()
                .forEach(taskEntry -> {
                    UUID taskId = taskEntry.getKey();
                    Task task = taskId != null ? taskRepository.findById(taskId).orElse(null) : null;

                    taskEntry.getValue().forEach((userId, userLogs) -> {
                        User user = userRepository.findById(userId).orElse(null);

                        Map<String, Object> userInfo = new LinkedHashMap<>();
                        userInfo.put("userName", user != null ? user.getName() : "N/A");
                        userInfo.put("userEmail", user != null ? user.getEmail() : "N/A");
                        userInfo.put("taskName", task != null ? task.getName() : "Project Only");

                        // Calculate totals
                        long totalMinutes = userLogs.stream()
                                .mapToLong(log -> log.getMinutes() != null ? log.getMinutes() : 0)
                                .sum();
                        int logCount = userLogs.size();

                        List<Map<String, Object>> logs = userLogs.stream()
                                .sorted(Comparator.comparing(TimeLog::getStartTime))
                                .map(log -> {
                                    Map<String, Object> logEntry = new LinkedHashMap<>();
                                    logEntry.put("startTime", log.getStartTime());
                                    logEntry.put("endTime", log.getEndTime());
                                    logEntry.put("duration", log.getMinutes());
                                    logEntry.put("description", log.getDescription());
                                    return logEntry;
                                })
                                .collect(Collectors.toList());

                        Map<String, Object> summary = new LinkedHashMap<>();
                        summary.put("totalTime", totalMinutes);
                        summary.put("totalLogs", logCount);
                        summary.put("firstEntry", userLogs.stream()
                                .map(TimeLog::getStartTime)
                                .min(LocalDateTime::compareTo)
                                .orElse(null));
                        summary.put("lastEntry", userLogs.stream()
                                .map(TimeLog::getEndTime)
                                .max(LocalDateTime::compareTo)
                                .orElse(null));

                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("userInfo", userInfo);
                        row.put("logs", logs);
                        row.put("summary", summary);

                        result.add(row);
                    });
                });

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Get recent tasks for user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recent tasks retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}/recent-tasks")
    public ResponseEntity<List<Map<String, Object>>> getRecentTasksForUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "5") int limit) {

        List<TimeLog> recentLogs = timeLogRepository.findByUserIdOrderByStartTimeDesc(userId);

        Map<UUID, Map<String, Object>> taskInfoMap = new LinkedHashMap<>();

        for (TimeLog log : recentLogs) {
            if (log.getTask() == null) continue;

            UUID taskId = log.getTask().getId();

            if (!taskInfoMap.containsKey(taskId)) {
                Map<String, Object> taskInfo = new HashMap<>();
                taskInfo.put("task", log.getTask());
                taskInfo.put("lastLogged", log.getStartTime());
                taskInfo.put("totalMinutes", 0L);
                taskInfoMap.put(taskId, taskInfo);
            }

            Long currentTotal = (Long) taskInfoMap.get(taskId).get("totalMinutes");
            taskInfoMap.get(taskId).put("totalMinutes",
                    currentTotal + (log.getMinutes() != null ? log.getMinutes() : 0));
        }

        List<Map<String, Object>> result = new ArrayList<>(taskInfoMap.values());

        result.sort((a, b) ->
                ((LocalDateTime) b.get("lastLogged")).compareTo((LocalDateTime) a.get("lastLogged")));

        if (result.size() > limit) {
            result = result.subList(0, limit);
        }

        return ResponseEntity.ok(result);
    }
}