package com.timestr.backend.controller;

import com.timestr.backend.model.Activity;
import com.timestr.backend.repository.ActivityRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activities")
@Tag(name = "Activities", description = "Endpoints for managing activities")
public class ActivityController {

    @Autowired
    private ActivityRepository activityRepository;

    @Operation(summary = "Get user activities", description = "Retrieves activities for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Activity>> getUserActivities(
            @Parameter(description = "ID of the user", required = true)
            @PathVariable UUID userId,
            @Parameter(description = "ID of the project to filter by", required = false)
            @RequestParam(required = false) UUID projectId) {

        List<Activity> activities;
        if (projectId != null) {
            activities = activityRepository.findByUserIdAndProjectIdOrderByCreatedAtDesc(userId, projectId);
        } else {
            activities = activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }

        return ResponseEntity.ok(activities);
    }
}