package com.timestr.backend.repository;

import com.timestr.backend.model.TaskLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskLogRepository extends JpaRepository<TaskLog, UUID> {
    List<TaskLog> findByTaskIdOrderByTimestampDesc(UUID taskId);


    @Modifying
    @Query("DELETE FROM TaskLog tl WHERE tl.task.id = :taskId")
    void deleteByTaskId(@Param("taskId") UUID taskId);
}