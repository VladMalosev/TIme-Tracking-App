package com.timestr.backend.repository;

import com.timestr.backend.model.User;
import com.timestr.backend.model.Workspace;
import com.timestr.backend.model.WorkspaceUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceUserRepository extends JpaRepository<WorkspaceUser, UUID> {
    List<WorkspaceUser> findByUserId(UUID userId);
    List<WorkspaceUser> findByWorkspaceId(UUID workspaceId);
    Optional<WorkspaceUser> findByUserAndWorkspace(User user, Workspace workspace);
    void deleteByWorkspace(Workspace workspace);

    void deleteByUserIdAndWorkspaceId(UUID userId, UUID id);
    boolean existsByUserIdAndWorkspaceId(UUID userId, UUID workspaceId);
    Optional<WorkspaceUser> findByUserIdAndWorkspaceId(UUID userId, UUID workspaceId);
}
