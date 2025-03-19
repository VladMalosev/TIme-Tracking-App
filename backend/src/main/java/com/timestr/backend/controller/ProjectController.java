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
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import com.timestr.backend.model.ProjectInvitation;


import java.time.LocalDateTime;
import java.util.*;
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
    private WorkspaceRepository workspaceRepository ;

    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private ProjectUserRepository projectUserRepository;
    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Operation(summary = "Create a new project", description = "Creates a new project in the user's workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User does not have permission to create a project"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project projectRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Workspace workspace = workspaceRepository.findByUserId(user.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User does not have a workspace"));

        if (!workspace.getUser().getId().equals(user.getId())) {
            WorkspaceUser workspaceUser = workspaceUserRepository.findByWorkspaceIdAndUserId(workspace.getId(), user.getId())
                    .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

            if (!workspaceUser.getRole().hasPermission("PROJECT_CREATE")) {
                throw new RuntimeException("You do not have permission to create a project");
            }
        }

        Project project = new Project();
        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());
        project.setWorkspace(workspace);
        project.setDeadline(projectRequest.getDeadline());
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        ProjectUser projectUser = new ProjectUser();
        projectUser.setUser(user);
        projectUser.setProject(project);
        projectUser.setRole(Role.OWNER);
        projectUser.setCreatedAt(LocalDateTime.now());
        projectUser.setUpdatedAt(LocalDateTime.now());
        projectUserRepository.save(projectUser);

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

        Workspace workspace = workspaceRepository.findByUserId(user.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User does not have a workspace"));

        List<Project> allProjects = projectRepository.findByWorkspaceId(workspace.getId());

        Map<String, List<Project>> response = new HashMap<>();
        response.put("projects", allProjects);

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

        Workspace workspace = workspaceRepository.findById(project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        if (!workspace.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only the owner can delete the project");
        }

        projectUserRepository.deleteByProjectId(projectId);

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        for (Task task : tasks) {
            timeLogRepository.deleteByTaskId(task.getId());
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
            @RequestParam Role role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectUser currentProjectUser = projectUserRepository.findByUserIdAndProjectId(currentUser.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("User is not part of this project"));

        if (!RoleUtils.canAssignRole(currentProjectUser.getRole(), role)) {
            throw new RuntimeException("You do not have permission to assign this role");
        }

        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (projectUserRepository.existsByUserIdAndProjectId(invitedUser.getId(), projectId)) {
            throw new RuntimeException("User is already a collaborator");
        }

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setInvitedUser(invitedUser);
        invitation.setRole(role);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setSender(currentUser);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setUpdatedAt(LocalDateTime.now());

        projectInvitationRepository.save(invitation);

        Activity activity = new Activity();
        activity.setProject(project);
        activity.setType(ActivityType.COLLABORATOR_INVITED);
        activity.setDescription("User '" + invitedUser.getName() + "' was invited to the project");
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

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
            @PathVariable UUID projectId,
            @RequestBody Project updatedProjectRequest) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Workspace workspace = workspaceRepository.findById(project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        if (!workspace.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to update this project");
        }

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
    @DeleteMapping("/{projectId}/collaborators/{collaboratorId}")
    @Transactional
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable UUID projectId,
            @PathVariable UUID collaboratorId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectUser currentProjectUser = projectUserRepository.findByUserIdAndProjectId(currentUser.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("User is not part of this project"));

        ProjectUser collaboratorToRemove = projectUserRepository.findById(collaboratorId)
                .orElseThrow(() -> new RuntimeException("Collaborator not found"));

        if (!collaboratorToRemove.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Collaborator does not belong to this project");
        }

        if (!RoleUtils.canRemoveCollaborator(currentProjectUser.getRole(), collaboratorToRemove.getRole())) {
            throw new RuntimeException("You do not have permission to remove this collaborator");
        }

        projectUserRepository.deleteById(collaboratorId);

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
    public ResponseEntity<List<Map<String, Object>>> getCollaborators(
            @PathVariable UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<ProjectUser> projectUsers = projectUserRepository.findByProjectId(projectId);

        List<Map<String, Object>> collaborators = projectUsers.stream()
                .map(projectUser -> {
                    Map<String, Object> collaborator = new HashMap<>();
                    collaborator.put("id", projectUser.getId());
                    collaborator.put("user", projectUser.getUser());
                    collaborator.put("role", projectUser.getRole());
                    collaborator.put("lastActivityDate", projectUser.getUpdatedAt());
                    return collaborator;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(collaborators);
    }

    @Operation(summary = "Get users by project", description = "Retrieves a list of users associated with a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}/users")
    public ResponseEntity<List<User>> getUsersByProject(
            @PathVariable UUID projectId) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<ProjectUser> projectUsers = projectUserRepository.findByProjectId(projectId);

        List<User> users = projectUsers.stream()
                .map(ProjectUser::getUser)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }




        @Operation(summary = "Get project statistics", description = "Retrieves statistics for a specific project.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
                @ApiResponse(responseCode = "404", description = "Project not found"),
                @ApiResponse(responseCode = "500", description = "Internal server error")
        })
        @GetMapping("/{projectId}/stats")
        public ResponseEntity<Map<String, Integer>> getProjectStats(@PathVariable UUID projectId) {
            int totalTasks = taskRepository.countByProjectId(projectId);
            int completedTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.COMPLETED);
            int totalMembers = projectUserRepository.countByProjectId(projectId);
            int upcomingDeadlines = taskRepository.countByProjectIdAndDeadlineAfter(projectId, LocalDateTime.now());

            Map<String, Integer> stats = new HashMap<>();
            stats.put("totalTasks", totalTasks);
            stats.put("completedTasks", completedTasks);
            stats.put("totalMembers", totalMembers);
            stats.put("upcomingDeadlines", upcomingDeadlines);

            return ResponseEntity.ok(stats);
        }

        @Operation(summary = "Get recent activities", description = "Retrieves recent activities for a specific project.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
                @ApiResponse(responseCode = "404", description = "Project not found"),
                @ApiResponse(responseCode = "500", description = "Internal server error")
        })
        @GetMapping("/{projectId}/activities")
        public ResponseEntity<List<String>> getRecentActivities(@PathVariable UUID projectId) {
        List<Activity> activities = activityRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        List<String> activityDescriptions = activities.stream()
                .map(Activity::getDescription)
                .collect(Collectors.toList());

        return ResponseEntity.ok(activityDescriptions);
        }

        @Operation(summary = "Get upcoming deadlines", description = "Retrieves upcoming deadlines for a specific project.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Deadlines retrieved successfully"),
                @ApiResponse(responseCode = "404", description = "Project not found"),
                @ApiResponse(responseCode = "500", description = "Internal server error")
        })
        @GetMapping("/{projectId}/deadlines")
        public ResponseEntity<List<Map<String, Object>>> getUpcomingDeadlines(@PathVariable UUID projectId) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime nextWeek = now.plusDays(7);

            List<Task> tasks = taskRepository.findByProjectIdAndDeadlineBetween(projectId, now, nextWeek);

            List<Map<String, Object>> deadlines = tasks.stream()
                    .map(task -> {
                        Map<String, Object> deadline = new HashMap<>();
                        deadline.put("task", task.getName());
                        deadline.put("date", task.getDeadline());
                        return deadline;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(deadlines);
        }


    @Operation(summary = "Get current user role", description = "Retrieves the current user's role for a specific project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}/current-user-role")
    public ResponseEntity<Map<String, String>> getCurrentUserRole(
            @Parameter(description = "ID of the project", required = true)
            @PathVariable UUID projectId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Workspace workspace = workspaceRepository.findById(project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        if (workspace.getUser().getId().equals(user.getId())) {
            Map<String, String> response = new HashMap<>();
            response.put("role", Role.OWNER.name());
            return ResponseEntity.ok(response);
        }

        ProjectUser projectUser = projectUserRepository.findByUserIdAndProjectId(user.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("User is not a collaborator on this project"));

        Map<String, String> response = new HashMap<>();
        response.put("role", projectUser.getRole().name());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Edit a project", description = "Edits a project. Only the owner or admin of the workspace can edit the project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User does not have permission to edit the project"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{projectId}/edit")
    public ResponseEntity<Project> editProject(
            @PathVariable UUID projectId,
            @RequestBody Project updatedProjectRequest) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Workspace workspace = workspaceRepository.findById(project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByWorkspaceIdAndUserId(workspace.getId(), user.getId())
                .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

        if (!workspaceUser.getRole().hasPermission("PROJECT_UPDATE")) {
            throw new RuntimeException("You do not have permission to edit this project");
        }

        project.setName(updatedProjectRequest.getName());
        project.setDescription(updatedProjectRequest.getDescription());
        project.setDeadline(updatedProjectRequest.getDeadline());
        project.setUpdatedAt(LocalDateTime.now());

        projectRepository.save(project);

        Activity activity = new Activity();
        activity.setProject(project);
        activity.setType(ActivityType.PROJECT_UPDATED);
        activity.setDescription("Project '" + project.getName() + "' was updated by user '" + user.getName() + "'");
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

        return ResponseEntity.ok(project);
    }
}