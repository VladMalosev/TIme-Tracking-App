package com.timestr.backend.controller;

import com.timestr.backend.dto.FrequentTask;
import com.timestr.backend.dto.PeakHour;
import com.timestr.backend.model.TaskStatus;
import com.timestr.backend.repository.TaskRepository;
import com.timestr.backend.repository.TimeLogRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics", description = "Endpoints for productivity analytics")
public class AnalyticsController {

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProductivityStats(
            @PathVariable UUID userId,
            @RequestParam(required = false) UUID projectId) {

        double efficiencyScore = calculateEfficiencyScore(userId, projectId);

        List<Map<String, Object>> peakHours = timeLogRepository.findPeakProductivityHours(userId, projectId);

        List<Map<String, Object>> frequentTasks = taskRepository.findFrequentTasks(userId, projectId);

        Map<String, Object> response = new HashMap<>();
        response.put("efficiencyScore", Math.round(efficiencyScore * 100));
        response.put("peakHours", formatPeakHours(peakHours));
        response.put("frequentTasks", formatFrequentTasks(frequentTasks));

        return ResponseEntity.ok(response);
    }

    private double calculateEfficiencyScore(UUID userId, UUID projectId) {
        long completedTasks = taskRepository.countByUserAndProjectAndStatus(userId, projectId, TaskStatus.COMPLETED);

        Double totalHours = timeLogRepository.sumHoursOnCompletedTasks(userId, projectId);
        if (totalHours == null || totalHours == 0) {
            return 0.0;
        }

        double tasksPerHour = completedTasks / totalHours;
        return Math.min(tasksPerHour / 2.0, 1.0);
    }

    private List<PeakHour> formatPeakHours(List<Map<String, Object>> rawHours) {
        return rawHours.stream()
                .map(hour -> {
                    PeakHour peakHour = new PeakHour();
                    peakHour.setTime(hour.get("hour").toString() + ":00");

                    Object efficiency = hour.get("efficiency");
                    double effValue = (efficiency == null) ? 0.0 : ((Number) efficiency).doubleValue();
                    peakHour.setEfficiency(effValue);

                    return peakHour;
                })
                .collect(Collectors.toList());
    }

    private List<FrequentTask> formatFrequentTasks(List<Map<String, Object>> rawTasks) {
        return rawTasks.stream()
                .map(task -> {
                    FrequentTask frequentTask = new FrequentTask();
                    frequentTask.setName((String) task.get("name"));
                    frequentTask.setCount(((Number) task.get("count")).longValue());
                    return frequentTask;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/user/{userId}/log-patterns")
    public ResponseEntity<Map<String, Object>> getUserLogCreationPatterns(
            @PathVariable UUID userId,
            @RequestParam(required = false) UUID projectId) {

        List<Map<String, Object>> hourlyDistribution = timeLogRepository.findLogCreationHourlyDistribution(userId, projectId);

        List<Map<String, Object>> dailyDistribution = timeLogRepository.findLogCreationDailyDistribution(userId, projectId);

        Map<String, Object> response = new HashMap<>();
        response.put("hourlyDistribution", formatHourlyDistribution(hourlyDistribution));
        response.put("dailyDistribution", formatDailyDistribution(dailyDistribution));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, String>> formatHourlyDistribution(List<Map<String, Object>> rawData) {
        return rawData.stream()
                .map(item -> {
                    Map<String, String> formatted = new HashMap<>();
                    formatted.put("hour", item.get("hour").toString() + ":00");
                    formatted.put("count", item.get("count").toString());
                    return formatted;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, String>> formatDailyDistribution(List<Map<String, Object>> rawData) {
        return rawData.stream()
                .map(item -> {
                    Map<String, String> formatted = new HashMap<>();
                    formatted.put("day", item.get("day_of_week").toString());
                    formatted.put("count", item.get("count").toString());
                    return formatted;
                })
                .collect(Collectors.toList());
    }
}
