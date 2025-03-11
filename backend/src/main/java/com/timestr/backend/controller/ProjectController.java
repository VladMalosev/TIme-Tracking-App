package com.timestr.backend.controller;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import com.timestr.backend.utils.RoleUtils;
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
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;

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
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        return ResponseEntity.ok(project);
    }

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

    @DeleteMapping("/{projectId}")
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

        projectRepository.delete(project);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/collaborators")
    public ResponseEntity<ProjectInvitation> inviteCollaborator(
            @PathVariable UUID projectId,
            @RequestParam String email,
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

    @DeleteMapping("/{projectId}/collaborators")
    @Transactional
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable UUID projectId,
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


    @GetMapping("/{projectId}/collaborators")
    public ResponseEntity<List<WorkspaceUser>> getCollaborators(@PathVariable UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(project.getWorkspace().getId());

        return ResponseEntity.ok(workspaceUsers);
    }
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}/users")
    public ResponseEntity<List<User>> getUsersByProject(@PathVariable UUID projectId) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<WorkspaceUser> workspaceUsers = workspaceUserRepository.findByWorkspaceId(project.getWorkspace().getId());

        List<User> users = workspaceUsers.stream()
                .map(WorkspaceUser::getUser)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

}