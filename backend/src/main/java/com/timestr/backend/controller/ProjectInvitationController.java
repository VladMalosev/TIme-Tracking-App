package com.timestr.backend.controller;

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

@RestController
@RequestMapping("/api/invitations")
@Tag(name = "Project Invitations", description = "Endpoints for managing project invitations")
public class ProjectInvitationController {
    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @Operation(summary = "Accept an invitation", description = "Accepts a project invitation and adds the user to the workspace.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invitation accepted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden: User is not authorized to accept this invitation"),
            @ApiResponse(responseCode = "404", description = "Invitation or user not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<WorkspaceUser> acceptInvitation(
            @Parameter(description = "ID of the invitation", required = true)
            @PathVariable Long invitationId) {
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

        WorkspaceUser newWorkspaceUser = new WorkspaceUser();
        newWorkspaceUser.setUser(user);
        newWorkspaceUser.setWorkspace(invitation.getProject().getWorkspace());
        newWorkspaceUser.setRole(invitation.getRole());
        newWorkspaceUser.setCreatedAt(LocalDateTime.now());
        newWorkspaceUser.setUpdatedAt(LocalDateTime.now());
        workspaceUserRepository.save(newWorkspaceUser);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setUpdatedAt(LocalDateTime.now());
        projectInvitationRepository.save(invitation);

        return ResponseEntity.ok(newWorkspaceUser);
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
            @PathVariable Long invitationId) {
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
}