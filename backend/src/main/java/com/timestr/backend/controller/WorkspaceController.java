package com.timestr.backend.controller;

import com.timestr.backend.dto.WorkspaceDetails;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private static final Logger logger = LoggerFactory.getLogger(WorkspaceController.class);

    private boolean hasWorkspacePermission(String permission, UUID workspaceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            logger.info("Authenticated user: " + authentication.getName());
            logger.info("User roles: " + authentication.getAuthorities());
        }

        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserAndWorkspace(user, workspaceRepository.findById(workspaceId).orElseThrow(() -> new RuntimeException("Workspace not found")))
                .orElseThrow(() -> new RuntimeException("User is not part of the workspace"));

        boolean hasPermission = workspaceUser.getRole().getPermissions().contains(permission);
        logger.info("Permission check for " + permission + " in workspace " + workspaceId + ": " + hasPermission);

        return hasPermission;
    }



    @PostMapping
    public ResponseEntity<Workspace> createWorkspace(@RequestBody Workspace workspaceRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Workspace workspace = new Workspace();
        workspace.setName(workspaceRequest.getName());
        workspace.setDescription(workspaceRequest.getDescription());
        workspace.setCreatedAt(LocalDateTime.now());
        workspace.setUpdatedAt(LocalDateTime.now());
        workspaceRepository.save(workspace);

        // Assign the user as the ADMIN of the workspace
        WorkspaceUser workspaceUser = new WorkspaceUser();
        workspaceUser.setUser(user);
        workspaceUser.setWorkspace(workspace);
        workspaceUser.setRole(WorkspaceRole.ADMIN);
        workspaceUser.setCreatedAt(LocalDateTime.now());
        workspaceUser.setUpdatedAt(LocalDateTime.now());
        workspaceUserRepository.save(workspaceUser);

        return ResponseEntity.ok(workspace);
    }


    @PostMapping("/{workspaceId}/users")
    public ResponseEntity<WorkspaceUser> addUserToWorkspace(
            @PathVariable UUID workspaceId,
            @RequestParam String email,
            @RequestParam WorkspaceRole role) {

        logger.info("Adding user to workspace: " + workspaceId);
        logger.info("Email: " + email + ", Role: " + role);

        if (!hasWorkspacePermission("WORKSPACE_ADD_USER", workspaceId)) {
            logger.error("Permission denied for user " + SecurityContextHolder.getContext().getAuthentication().getName());
            throw new RuntimeException("Permission denied");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        User user = userRepository.findByEmail(email)
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



    @GetMapping
    public ResponseEntity<List<WorkspaceUser>> getUserWorkspaces() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByUserId(user.getId());
        return ResponseEntity.ok(workspaceUsers);
    }

    @GetMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceDetails> getWorkspaceDetails(@PathVariable UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(workspaceId);

        List<Project> projects = projectRepository.findByWorkspaceId(workspaceId);
        WorkspaceDetails workspaceDetails = new WorkspaceDetails();
        workspaceDetails.setWorkspace(workspace);
        workspaceDetails.setUsers(workspaceUsers);
        workspaceDetails.setProjects(projects);

        return ResponseEntity.ok(workspaceDetails);
    }

    @Transactional
    @DeleteMapping("/{workspaceId}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable UUID workspaceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserAndWorkspace(user, workspace)
                .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

        if (workspaceUser.getRole() != WorkspaceRole.ADMIN) {
            throw new RuntimeException("Only the workspace ADMIN can delete the workspace");
        }

        workspaceUserRepository.deleteByWorkspace(workspace);
        workspaceRepository.delete(workspace);

        return ResponseEntity.noContent().build();
    }
}