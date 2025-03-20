package com.timestr.backend.repository;

import com.timestr.backend.model.InvitationStatus;
import com.timestr.backend.model.WorkspaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, UUID> {
    List<WorkspaceInvitation> findByInvitedUserIdAndStatus(UUID invitedUserId, InvitationStatus status);
    List<WorkspaceInvitation> findByWorkspaceId(UUID workspaceId);
    boolean existsByWorkspaceIdAndInvitedUserId(UUID workspaceId, UUID invitedUserId);
}