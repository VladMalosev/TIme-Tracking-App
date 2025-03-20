package com.timestr.backend.repository;

import com.timestr.backend.model.Role;
import com.timestr.backend.model.WorkspaceUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceUserRepository extends JpaRepository<WorkspaceUser, UUID> {

    Optional<WorkspaceUser> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    List<WorkspaceUser> findByWorkspaceId(UUID workspaceId);

    void deleteByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    Optional<WorkspaceUser> findByWorkspaceIdAndRole(UUID workspaceId, Role role);

    List<WorkspaceUser> findByUserId(UUID id);
}