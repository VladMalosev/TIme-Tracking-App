package com.timestr.backend.controller;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.hibernate.jdbc.Work;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workspaces")
@Tag(name = "Workspaces", description = "Endpoints for managing workspaces and workspace users")
public class WorkspaceController {



    @Autowired
    private WorkspaceInvitationRepository workspaceInvitationRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectUserRepository projectUserRepository;

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


    @Operation(summary = "Get workspaces and collaborated projects for the current user", description = "Retrieves a list of workspaces and projects the current user is part of.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workspaces and projects retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> getWorkspacesAndProjectsForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Workspace> ownedWorkspaces = workspaceRepository.findByUserId(user.getId());
        List<Workspace> collaboratedWorkspaces = workspaceRepository.findCollaboratedWorkspacesByUserId(user.getId());

        Set<Workspace> allWorkspacesSet = new HashSet<>();
        allWorkspacesSet.addAll(ownedWorkspaces);
        allWorkspacesSet.addAll(collaboratedWorkspaces);

        List<Workspace> allWorkspaces = new ArrayList<>(allWorkspacesSet);

        List<ProjectUser> projectUsers = projectUserRepository.findByUserId(user.getId());
        List<Project> collaboratedProjects = projectUsers.stream()
                .map(ProjectUser::getProject)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("workspaces", allWorkspaces);
        response.put("collaboratedProjects", collaboratedProjects);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Invite a user to a workspace", description = "Invites a user to a workspace with a specific role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "404", description = "Workspace or user not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden: Invalid role or owner already exists"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/invite")
    public ResponseEntity<WorkspaceInvitation> inviteUserToWorkspace(
            @RequestBody Map<String, String> payload) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        UUID workspaceId = UUID.fromString(payload.get("workspaceId"));
        String email = payload.get("email");
        Role role = Role.valueOf(payload.get("role"));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (role == null || !Arrays.asList(Role.values()).contains(role)) {
            throw new RuntimeException("Invalid role");
        }

        if (role == Role.OWNER) {
            Optional<WorkspaceUser> existingOwner = workspaceUserRepository.findByWorkspaceIdAndRole(workspaceId, Role.OWNER);
            if (existingOwner.isPresent()) {
                throw new RuntimeException("An owner already exists for this workspace");
            }
        }

        WorkspaceInvitation invitation = new WorkspaceInvitation();
        invitation.setWorkspace(workspace);
        invitation.setInvitedUser(invitedUser);
        invitation.setRole(role);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setSender(sender);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setUpdatedAt(LocalDateTime.now());

        workspaceInvitationRepository.save(invitation);

        return ResponseEntity.ok(invitation);
    }

    @Operation(summary = "Accept a workspace invitation", description = "Accepts a workspace invitation and assigns the user the same role in all projects within the workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation accepted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "404", description = "Invitation not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<Void> acceptWorkspaceInvitation(@PathVariable UUID invitationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceInvitation invitation = workspaceInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to accept this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending");
        }

        WorkspaceUser workspaceUser = new WorkspaceUser();
        workspaceUser.setUser(user);
        workspaceUser.setWorkspace(invitation.getWorkspace());
        workspaceUser.setRole(invitation.getRole());
        workspaceUser.setCreatedAt(LocalDateTime.now());
        workspaceUser.setUpdatedAt(LocalDateTime.now());
        workspaceUserRepository.save(workspaceUser);

        List<Project> projects = projectRepository.findByWorkspaceId(invitation.getWorkspace().getId());
        for (Project project : projects) {
            ProjectUser projectUser = new ProjectUser();
            projectUser.setUser(user);
            projectUser.setProject(project);
            projectUser.setRole(invitation.getRole());
            projectUser.setCreatedAt(LocalDateTime.now());
            projectUser.setUpdatedAt(LocalDateTime.now());
            projectUserRepository.save(projectUser);
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setUpdatedAt(LocalDateTime.now());
        workspaceInvitationRepository.save(invitation);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get pending workspace invitations", description = "Retrieves a list of pending workspace invitations for the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending invitations retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/invitations/pending")
    public ResponseEntity<List<WorkspaceInvitation>> getPendingWorkspaceInvitations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkspaceInvitation> pendingInvitations = workspaceInvitationRepository.findByInvitedUserIdAndStatus(user.getId(), InvitationStatus.PENDING);
        return ResponseEntity.ok(pendingInvitations);
    }

    @Operation(summary = "Reject a workspace invitation", description = "Rejects a workspace invitation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Invitation rejected successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User is not authorized to reject this invitation"),
            @ApiResponse(responseCode = "404", description = "Invitation or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/invitations/{invitationId}/reject")
    public ResponseEntity<Void> rejectWorkspaceInvitation(
            @Parameter(description = "ID of the invitation", required = true)
            @PathVariable UUID invitationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceInvitation invitation = workspaceInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to reject this invitation");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitation.setUpdatedAt(LocalDateTime.now());
        workspaceInvitationRepository.save(invitation);

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get collaborated projects for the current user", description = "Retrieves a list of projects where the user is a collaborator but not a workspace member.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collaborated projects retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/collaborated-projects")
    public ResponseEntity<List<Project>> getCollaboratedProjectsForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ProjectUser> projectUsers = projectUserRepository.findByUserId(user.getId());
        List<Project> collaboratedProjects = projectUsers.stream()
                .map(ProjectUser::getProject)
                .collect(Collectors.toList());

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByUserId(user.getId());
        Set<UUID> workspaceIds = workspaceUsers.stream()
                .map(workspaceUser -> workspaceUser.getWorkspace().getId())
                .collect(Collectors.toSet());

        List<Project> filteredProjects = collaboratedProjects.stream()
                .filter(project -> !workspaceIds.contains(project.getWorkspace().getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredProjects);
    }


}