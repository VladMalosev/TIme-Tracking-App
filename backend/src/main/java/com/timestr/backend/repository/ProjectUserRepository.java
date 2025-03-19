package com.timestr.backend.repository;

import com.timestr.backend.model.ProjectUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectUserRepository extends JpaRepository<ProjectUser, UUID> {
    List<ProjectUser> findByProjectId(UUID projectId);

    void deleteByUserIdAndProjectId(UUID userId, UUID projectId);

    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);

    Optional<ProjectUser> findByUserIdAndProjectId(UUID userId, UUID projectId);

    List<ProjectUser> findByUserId(UUID id);
    int countByProjectId(UUID projectId);
    void deleteByProjectId(UUID projectId);
}
