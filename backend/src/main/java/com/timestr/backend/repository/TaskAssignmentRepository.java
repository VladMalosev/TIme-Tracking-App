package com.timestr.backend.repository;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, UUID> {
    List<TaskAssignment> findByUserId(UUID userId);
    void deleteByTaskId(UUID taskId);
}
