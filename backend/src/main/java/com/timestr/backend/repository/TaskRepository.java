package com.timestr.backend.repository;

import com.timestr.backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectId(UUID projectId);
    List<Task> findByAssignedUserId(UUID assignedUserId);

    List<UUID> findTaskIdsByProjectId(UUID projectId);
}
