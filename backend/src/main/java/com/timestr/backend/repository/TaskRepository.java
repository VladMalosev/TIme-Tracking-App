package com.timestr.backend.repository;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectId(UUID projectId);
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId")
    List<Task> findByAssignedToId(@Param("userId") UUID userId);

    List<UUID> findTaskIdsByProjectId(UUID projectId);
    int countByProjectId(UUID projectId);
    int countByProjectIdAndStatus(UUID projectId, TaskStatus status);
    int countByProjectIdAndDeadlineAfter(UUID projectId, LocalDateTime deadline);
    List<Task> findByProjectIdAndDeadlineBetween(UUID projectId, LocalDateTime start, LocalDateTime end);
    void deleteByProjectId(UUID projectId);

    List<Task> findByProjectIdAndStatusAndAssignedToIsNull(UUID projectId, TaskStatus taskStatus);

    List<Task> findByProjectIdAndStatusNot(UUID projectId, TaskStatus status);
}
