package com.timestr.backend.controller;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.ProjectRepository;
import com.timestr.backend.repository.UserRepository;
import com.timestr.backend.repository.WorkspaceRepository;
import com.timestr.backend.repository.WorkspaceUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@Tag(name = "Workspaces", description = "Endpoints for managing workspaces and workspace users")
public class WorkspaceController {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Operation(summary = "Add a user to a workspace", description = "Adds a user to a workspace with a specific role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User added to workspace successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "404", description = "Workspace or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{workspaceId}/users")
    public ResponseEntity<WorkspaceUser> addUserToWorkspace(
            @PathVariable UUID workspaceId,
            @RequestParam UUID userId,
            @RequestParam Role role) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceUser workspaceUser = new WorkspaceUser();
        workspaceUser.setUser(user);
        workspaceUser.setWorkspace(workspace);
        workspaceUser.setRole(role);
        workspaceUser.setCreatedAt(LocalDateTime.now());
        workspaceUser.setUpdatedAt(LocalDateTime.now());

        workspaceUserRepository.save(workspaceUser);

        return ResponseEntity.ok(workspaceUser);
    }

    @Operation(summary = "Remove a user from a workspace", description = "Removes a user from a workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User removed from workspace successfully"),
            @ApiResponse(responseCode = "404", description = "Workspace or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{workspaceId}/users/{userId}")
    public ResponseEntity<Void> removeUserFromWorkspace(
            @PathVariable UUID workspaceId,
            @PathVariable UUID userId) {

        WorkspaceUser workspaceUser = workspaceUserRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new RuntimeException("User not found in workspace"));

        workspaceUserRepository.delete(workspaceUser);

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get users in a workspace", description = "Retrieves a list of users in a workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Workspace not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{workspaceId}/users")
    public ResponseEntity<List<WorkspaceUser>> getUsersInWorkspace(@PathVariable UUID workspaceId) {
        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(workspaceId);
        return ResponseEntity.ok(workspaceUsers);
    }

    @GetMapping("/{workspaceId}/projects")
    public ResponseEntity<List<Project>> getWorkspaceProjects(@PathVariable UUID workspaceId) {
        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        return ResponseEntity.ok(projects);
    }
}