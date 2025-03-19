package com.timestr.backend.repository;

import com.timestr.backend.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {


    List<Workspace> findByUserId(UUID userId);
}
