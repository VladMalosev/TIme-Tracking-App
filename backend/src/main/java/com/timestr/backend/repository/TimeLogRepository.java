package com.timestr.backend.repository;

import com.timestr.backend.model.TimeLog;
import com.timestr.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, UUID> {
    Optional<TimeLog> findFirstByUserAndEndTimeIsNullOrderByStartTimeDesc(User user);
    List<TimeLog> findByUser(User user);
    void deleteByTaskId(UUID taskId);
}
