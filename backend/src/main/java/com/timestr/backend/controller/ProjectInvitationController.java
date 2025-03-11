package com.timestr.backend.controller;

import com.timestr.backend.model.*;
import com.timestr.backend.repository.*;
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
public class ProjectInvitationController {
    @Autowired
    private ProjectInvitationRepository projectInvitationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WorkspaceUserRepository workspaceUserRepository;

    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<WorkspaceUser> acceptInvitation(@PathVariable Long invitationId) {
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

    @PostMapping("/{invitationId}/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable Long invitationId) {
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