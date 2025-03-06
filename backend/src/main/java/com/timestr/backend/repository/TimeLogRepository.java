package com.timestr.backend.repository;

import com.timestr.backend.model.Task;
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
    List<TimeLog> findByTaskId(UUID taskId);
    Optional<TimeLog> findFirstByUserAndTaskAndEndTimeIsNullOrderByStartTimeDesc(User user, Task task);
    Optional<TimeLog> findFirstByUserAndTaskIsNullAndEndTimeIsNullOrderByStartTimeDesc(User user);
    List<TimeLog> findByUserAndTaskIsNull(User user);
    List<TimeLog> findByUserAndTask(User user, Task task);
    boolean existsByUserAndTaskAndEndTimeIsNull(User user, Task task);

    boolean existsByUserAndTaskIsNullAndEndTimeIsNull(User user);
}
