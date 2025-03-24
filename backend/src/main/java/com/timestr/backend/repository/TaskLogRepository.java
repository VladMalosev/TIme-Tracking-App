package com.timestr.backend.repository;

import com.timestr.backend.model.TaskLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskLogRepository extends JpaRepository<TaskLog, UUID> {
    List<TaskLog> findByTaskIdOrderByTimestampDesc(UUID taskId);
}