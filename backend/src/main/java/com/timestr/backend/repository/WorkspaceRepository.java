package com.timestr.backend.repository;

import com.timestr.backend.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {


    List<Workspace> findByUserId(UUID userId);


    @Query("SELECT w FROM Workspace w JOIN WorkspaceUser wu ON w.id = wu.workspace.id WHERE wu.user.id = :userId")
    List<Workspace> findCollaboratedWorkspacesByUserId(@Param("userId") UUID userId);
}
