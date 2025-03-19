package com.timestr.backend.repository;

import com.timestr.backend.model.ProjectUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectUserRepository extends JpaRepository<ProjectUser, UUID> {
    List<ProjectUser> findByUserId(UUID id);

    boolean existsByUserIdAndProjectId(UUID id, UUID projectId);
}
