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

    @Autowired
    private AuditLogRepository auditLogRepository;

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

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(workspace.getId());
        for (WorkspaceUser workspaceUser : workspaceUsers) {
            ProjectUser projectUser = new ProjectUser();
            projectUser.setUser(workspaceUser.getUser());
            projectUser.setProject(project);
            projectUser.setRole(workspaceUser.getRole());
            projectUser.setCreatedAt(LocalDateTime.now());
            projectUser.setUpdatedAt(LocalDateTime.now());
            projectUserRepository.save(projectUser);
        }

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

        activityRepository.deleteByProjectId(projectId);
        projectUserRepository.deleteByProjectId(projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        for (Task task : tasks) {
            timeLogRepository.deleteByTaskId(task.getId());
            taskAssignmentRepository.deleteByTaskId(task.getId());
        }

        taskRepository.deleteByProjectId(projectId);
        projectInvitationRepository.deleteByProjectId(projectId);
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

        AuditLog auditLog = new AuditLog();
        auditLog.setAction(AuditAction.USER_INVITED);
        auditLog.setPerformedBy(currentUser);
        auditLog.setTargetUser(invitedUser);
        auditLog.setProject(project);
        auditLog.setNewValue(role.name());
        auditLog.setDescription(String.format(
                "%s invited %s to project %s with role %s",
                currentUser.getName(),
                invitedUser.getName(),
                project.getName(),
                role
        ));
        auditLogRepository.save(auditLog);

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
        String currentUserEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
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

        Activity activity = new Activity();
        activity.setProject(project);
        activity.setUser(currentUser);
        activity.setType(ActivityType.USER_REMOVED);
        activity.setDescription(String.format(
                "User %s removed %s from project %s",
                currentUser.getName(),
                collaboratorToRemove.getUser().getName(),
                project.getName()
        ));
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

        AuditLog auditLog = new AuditLog();
        auditLog.setAction(AuditAction.USER_REMOVED);
        auditLog.setPerformedBy(currentUser);
        auditLog.setTargetUser(collaboratorToRemove.getUser());
        auditLog.setProject(project);
        auditLog.setDescription(String.format(
                "%s removed %s from project %s",
                currentUser.getName(),
                collaboratorToRemove.getUser().getName(),
                project.getName()
        ));
        auditLogRepository.save(auditLog);


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

    @Operation(summary = "Get projects where the user is a collaborator", description = "Retrieves a list of projects where the user is a collaborator.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Projects retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/collaborated")
    public ResponseEntity<List<Project>> getCollaboratedProjects() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ProjectUser> projectUsers = projectUserRepository.findByUserId(user.getId());
        List<Project> projects = projectUsers.stream()
                .map(ProjectUser::getProject)
                .collect(Collectors.toList());

        return ResponseEntity.ok(projects);
    }


    @Operation(summary = "Change collaborator role",
            description = "Changes a collaborator's role in a project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role changed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid role change request"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User doesn't have permission to change roles"),
            @ApiResponse(responseCode = "404", description = "Project or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{projectId}/collaborators/{collaboratorId}/role")
    public ResponseEntity<ProjectUser> changeCollaboratorRole(
            @PathVariable UUID projectId,
            @PathVariable UUID collaboratorId,
            @RequestParam Role newRole) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectUser currentProjectUser = projectUserRepository.findByUserIdAndProjectId(currentUser.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("Current user is not a member of this project"));

        ProjectUser collaboratorToUpdate = projectUserRepository.findById(collaboratorId)
                .orElseThrow(() -> new RuntimeException("Collaborator not found"));

        if (!collaboratorToUpdate.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Collaborator does not belong to this project");
        }

        if (!RoleUtils.canChangeRole(currentProjectUser.getRole(), collaboratorToUpdate.getRole(), newRole)) {
            throw new RuntimeException("You don't have permission to perform this role change");
        }

        if (!RoleUtils.canAssignRole(currentProjectUser.getRole(), newRole)) {
            throw new RuntimeException("You don't have permission to assign this role");
        }

        if (collaboratorToUpdate.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You cannot change your own role");
        }

        Role oldRole = collaboratorToUpdate.getRole();
        collaboratorToUpdate.setRole(newRole);
        collaboratorToUpdate.setUpdatedAt(LocalDateTime.now());
        projectUserRepository.save(collaboratorToUpdate);

        Activity activity = new Activity();
        activity.setProject(project);
        activity.setUser(currentUser);
        activity.setType(ActivityType.ROLE_CHANGED);
        activity.setDescription(String.format(
                "User %s changed role of %s from %s to %s in project %s",
                currentUser.getName(),
                collaboratorToUpdate.getUser().getName(),
                oldRole,
                newRole,
                project.getName()
        ));
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

        AuditLog auditLog = new AuditLog();
        auditLog.setAction(AuditAction.ROLE_CHANGED);
        auditLog.setPerformedBy(currentUser);
        auditLog.setTargetUser(collaboratorToUpdate.getUser());
        auditLog.setProject(project);
        auditLog.setOldValue(oldRole.name());
        auditLog.setNewValue(newRole.name());
        auditLog.setDescription(String.format(
                "%s changed %s's role from %s to %s in project %s",
                currentUser.getName(),
                collaboratorToUpdate.getUser().getName(),
                oldRole,
                newRole,
                project.getName()
        ));
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(collaboratorToUpdate);
    }


    @Operation(summary = "Get role change history for project",
            description = "Retrieves history of role changes for a specific project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "History retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User doesn't have permission to view history"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{projectId}/role-changes")
    public ResponseEntity<List<Activity>> getRoleChangeHistory(
            @PathVariable UUID projectId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectUser currentProjectUser = projectUserRepository.findByUserIdAndProjectId(currentUser.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this project"));

        if (currentProjectUser.getRole() != Role.OWNER && currentProjectUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("You don't have permission to view this history");
        }

        List<Activity> roleChanges = activityRepository.findByProjectIdAndTypeOrderByCreatedAtDesc(
                projectId, ActivityType.ROLE_CHANGED);

        return ResponseEntity.ok(roleChanges);
    }

    @Operation(summary = "Get member activity logs",
            description = "Retrieves audit logs for member-related activities in a project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logs retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User doesn't have permission to view logs"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/{projectId}/member-logs")
    public ResponseEntity<List<Map<String, Object>>> getMemberActivityLogs(
            @PathVariable UUID projectId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(defaultValue = "30") int days) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        ProjectUser currentProjectUser = projectUserRepository.findByUserIdAndProjectId(currentUser.getId(), projectId)
                .orElseThrow(() -> new RuntimeException("User is not part of this project"));

        if (!Arrays.asList(Role.OWNER, Role.ADMIN, Role.MANAGER).contains(currentProjectUser.getRole())) {
            throw new RuntimeException("You don't have permission to view these logs");
        }

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        List<AuditLog> logs;

        if (action != null) {
            logs = auditLogRepository.findByProjectIdAndActionAndCreatedAtAfterOrderByCreatedAtDesc(
                    projectId, action, cutoffDate);
        } else {
            logs = auditLogRepository.findByProjectIdAndCreatedAtAfterOrderByCreatedAtDesc(
                    projectId, cutoffDate);
        }

        List<Map<String, Object>> response = logs.stream().map(log -> {
            Map<String, Object> logEntry = new HashMap<>();
            logEntry.put("id", log.getId());
            logEntry.put("action", log.getAction());
            logEntry.put("timestamp", log.getCreatedAt());
            logEntry.put("initiator", log.getPerformedBy() != null ?
                    Map.of("id", log.getPerformedBy().getId(), "name", log.getPerformedBy().getName()) : null);
            logEntry.put("targetUser", log.getTargetUser() != null ?
                    Map.of("id", log.getTargetUser().getId(), "name", log.getTargetUser().getName()) : null);
            logEntry.put("oldValue", log.getOldValue());
            logEntry.put("newValue", log.getNewValue());
            logEntry.put("description", log.getDescription());
            return logEntry;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }


}