package com.timestr.backend.controller;

import com.timestr.backend.dto.ProjectInvitationResponse;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@Tag(name = "Project Invitations", description = "Endpoints for managing project invitations")
public class ProjectInvitationController {
    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProjectUserRepository projectUserRepository;
    @Autowired
    private ActivityRepository activityRepository;

    @Operation(summary = "Accept an invitation", description = "Accepts a project invitation and adds the user to the workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation accepted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User is not authorized to accept this invitation"),
            @ApiResponse(responseCode = "404", description = "Invitation or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<ProjectUser> acceptInvitation(
            @PathVariable UUID invitationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to accept this invitation");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending");
        }

        ProjectUser projectUser = new ProjectUser();
        projectUser.setUser(user);
        projectUser.setProject(invitation.getProject());
        projectUser.setRole(invitation.getRole());
        projectUser.setCreatedAt(LocalDateTime.now());
        projectUser.setUpdatedAt(LocalDateTime.now());
        projectUserRepository.save(projectUser);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setUpdatedAt(LocalDateTime.now());
        projectInvitationRepository.save(invitation);

        Activity activity = new Activity();
        activity.setProject(invitation.getProject());
        activity.setType(ActivityType.COLLABORATOR_JOINED);
        activity.setDescription("User '" + user.getName() + "' joined the project");
        activity.setCreatedAt(LocalDateTime.now());
        activityRepository.save(activity);

        return ResponseEntity.ok(projectUser);
    }

    @Operation(summary = "Reject an invitation", description = "Rejects a project invitation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Invitation rejected successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User is not authorized to reject this invitation"),
            @ApiResponse(responseCode = "404", description = "Invitation or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{invitationId}/reject")
    public ResponseEntity<Void> rejectInvitation(
            @Parameter(description = "ID of the invitation", required = true)
            @PathVariable UUID invitationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to reject this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitation.setUpdatedAt(LocalDateTime.now());
        projectInvitationRepository.save(invitation);

        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get pending invitations", description = "Retrieves a list of pending invitations for the user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending invitations retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/pending")
    public ResponseEntity<List<ProjectInvitation>> getPendingInvitations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ProjectInvitation> pendingInvitations = projectInvitationRepository.findByInvitedUserIdAndStatus(user.getId(), InvitationStatus.PENDING);

        return ResponseEntity.ok(pendingInvitations);
    }

    @Operation(summary = "Get sent invitations", description = "Retrieves a list of invitations sent for a specific project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitations retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectInvitationResponse>> getProjectInvitations(
            @PathVariable UUID projectId) {

        List<ProjectInvitation> invitations = projectInvitationRepository.findByProjectId(projectId);

        List<ProjectInvitationResponse> response = invitations.stream().map(invitation ->
                new ProjectInvitationResponse(
                        invitation.getId(),
                        invitation.getInvitedUser().getEmail(),
                        invitation.getInvitedUser().getName(),
                        invitation.getRole(),
                        invitation.getStatus(),
                        invitation.getCreatedAt(),
                        invitation.getSender().getEmail()
                )
        ).toList();

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete an invitation", description = "Deletes a project invitation by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Invitation deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User is not authorized to delete this invitation"),
            @ApiResponse(responseCode = "404", description = "Invitation not found"),
            @ApiResponse(responseCode = "400", description = "Bad Request: Invitation is not pending"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{invitationId}")
    public ResponseEntity<Void> deleteInvitation(
            @Parameter(description = "ID of the invitation", required = true)
            @PathVariable UUID invitationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending and cannot be deleted");
        }

        projectInvitationRepository.delete(invitation);

        return ResponseEntity.noContent().build();
    }
}