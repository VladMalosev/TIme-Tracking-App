package com.timestr.backend.repository;

import com.timestr.backend.model.InvitationStatus;
import com.timestr.backend.model.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {
    List<ProjectInvitation> findByInvitedUserId(UUID userId);
    List<ProjectInvitation> findByInvitedUserIdAndStatus(UUID userId, InvitationStatus status);

    void deleteByProjectId(UUID projectId);
}