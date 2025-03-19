package com.timestr.backend.controller;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import com.timestr.backend.utils.RoleUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.timestr.backend.model.ProjectInvitation;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Endpoints for managing projects and project collaborators")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private ProjectUserRepository projectUserRepository;

    @Operation(summary = "Create a new project", description = "Creates a new project in the user's workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project projectRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User is not part of any workspace"));
        Workspace workspace = workspaceUser.getWorkspace();

        Project project = new Project();
        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());
        project.setWorkspace(workspace);
        project.setDeadline(projectRequest.getDeadline());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        return ResponseEntity.ok(project);
    }

    @Operation(summary = "Get user projects", description = "Retrieves a list of projects owned and collaborated on by the user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Projects retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<Map<String, List<Project>>> getUserProjects() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByUserId(user.getId());

        // owner
        List<Project> ownedProjects = workspaceUsers.stream()
                .filter(workspaceUser -> workspaceUser.getRole() == WorkspaceRole.OWNER)
                .map(WorkspaceUser::getWorkspace)
                .flatMap(workspace -> projectRepository.findByWorkspaceId(workspace.getId()).stream())
                .collect(Collectors.toList());

        // collaborator
        List<Project> collaboratedProjects = workspaceUsers.stream()
                .filter(workspaceUser -> workspaceUser.getRole() != WorkspaceRole.OWNER)
                .map(WorkspaceUser::getWorkspace)
                .flatMap(workspace -> projectRepository.findByWorkspaceId(workspace.getId()).stream())
                .collect(Collectors.toList());

        Map<String, List<Project>> response = new HashMap<>();
        response.put("ownedProjects", ownedProjects);
        response.put("collaboratedProjects", collaboratedProjects);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete a project", description = "Deletes a project. Only the owner can delete the project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden: Only the owner can delete the project"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{projectId}")
    @Transactional
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User is not part of any workspace"));

        if (workspaceUser.getRole() != WorkspaceRole.OWNER) {
            throw new RuntimeException("Only the owner can delete the project");
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        for (Task task : tasks) {
            timeLogRepository.deleteByTaskId(task.getId());
        }

        for (Task task : tasks) {
            taskAssignmentRepository.deleteByTaskId(task.getId());
        }

        projectInvitationRepository.deleteByProjectId(projectId);
        taskRepository.deleteByProjectId(projectId);
        projectRepository.delete(project);

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Invite a collaborator", description = "Invites a user to collaborate on a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User does not have permission to assign this role"),
            @ApiResponse(responseCode = "404", description = "User or project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{projectId}/collaborators")
    public ResponseEntity<ProjectInvitation> inviteCollaborator(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId,
            @Parameter(description = "Email of the user to invite", required = true, example = "user@example.com")
            @RequestParam String email,
            @Parameter(description = "Role to assign to the collaborator", required = true)
            @RequestParam WorkspaceRole role) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        WorkspaceUser currentWorkspaceUser = workspaceUserRepository.findByUserIdAndWorkspaceId(currentUser.getId(), project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

        if (!RoleUtils.canAssignRole(currentWorkspaceUser.getRole(), role)) {
            throw new RuntimeException("You do not have permission to assign this role");
        }

        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the invited user is already a collaborator
        if (workspaceUserRepository.existsByUserIdAndWorkspaceId(invitedUser.getId(), project.getWorkspace().getId())) {
            throw new RuntimeException("User is already a collaborator");
        }

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setInvitedUser(invitedUser);
        invitation.setRole(role);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setUpdatedAt(LocalDateTime.now());

        projectInvitationRepository.save(invitation);

        return ResponseEntity.ok(invitation);
    }


    @Operation(summary = "Update a project", description = "Updates the details of a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User does not have permission to update the project"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{projectId}")
    public ResponseEntity<Project> updateProject(
            @Parameter(description = "ID of the project to update", required = true)
            @PathVariable UUID projectId,
            @RequestBody Project updatedProjectRequest) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User is not part of any workspace"));

        if (!project.getWorkspace().getId().equals(workspaceUser.getWorkspace().getId())) {
            throw new RuntimeException("Project does not belong to the user's workspace");
        }

        // Update fields
        project.setName(updatedProjectRequest.getName());
        project.setDescription(updatedProjectRequest.getDescription());
        project.setClient(updatedProjectRequest.getClient());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        return ResponseEntity.ok(project);
    }

    @Operation(summary = "Remove a collaborator", description = "Removes a collaborator from a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Collaborator removed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User does not have permission to remove the collaborator"),
            @ApiResponse(responseCode = "404", description = "User or project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{projectId}/collaborators")
    @Transactional
    public ResponseEntity<Void> removeCollaborator(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId,
            @Parameter(description = "Email of the collaborator to remove", required = true, example = "user@example.com")
            @RequestParam String email) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        WorkspaceUser currentWorkspaceUser = workspaceUserRepository.findByUserIdAndWorkspaceId(currentUser.getId(), project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

        User userToRemove = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkspaceUser userToRemoveWorkspaceUser = workspaceUserRepository.findByUserIdAndWorkspaceId(userToRemove.getId(), project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("User is not a collaborator"));

        if (!RoleUtils.canRemoveCollaborator(currentWorkspaceUser.getRole(), userToRemoveWorkspaceUser.getRole())) {
            throw new RuntimeException("You do not have permission to remove this collaborator");
        }
        workspaceUserRepository.deleteByUserIdAndWorkspaceId(userToRemove.getId(), project.getWorkspace().getId());

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get project by ID", description = "Retrieves a project by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}")
    public ResponseEntity<Project> getProjectById(@PathVariable UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return ResponseEntity.ok(project);
    }

    @Operation(summary = "Get collaborators", description = "Retrieves a list of collaborators for a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collaborators retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}/collaborators")
    public ResponseEntity<List<WorkspaceUser>> getCollaborators(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(project.getWorkspace().getId());

        return ResponseEntity.ok(workspaceUsers);
    }
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        return ResponseEntity.ok(projects);
    }

    @Operation(summary = "Get users by project", description = "Retrieves a list of users associated with a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}/users")
    public ResponseEntity<List<User>> getUsersByProject(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(project.getWorkspace().getId());

        List<User> users = workspaceUsers.stream()
                .map(WorkspaceUser::getUser)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

}