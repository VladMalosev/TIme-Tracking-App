package com.timestr.backend.repository;

import com.timestr.backend.model.Task;
import com.timestr.backend.model.TimeLog;
import com.timestr.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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
    boolean existsByUserAndTaskAndEndTimeIsNull(User user, Task task);
    boolean existsByUserAndTaskIsNullAndEndTimeIsNull(User user);
    List<TimeLog> findByTaskIdAndLoggedAtBetween(UUID taskId, LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT tl FROM TimeLog tl JOIN tl.task t WHERE t.project.id = :projectId")
    List<TimeLog> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT tl FROM TimeLog tl JOIN tl.task t WHERE t.project.id = :projectId AND tl.loggedAt BETWEEN :startTime AND :endTime")
    List<TimeLog> findByProjectIdAndLoggedAtBetween(
            @Param("projectId") UUID projectId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT tl FROM TimeLog tl JOIN tl.task t WHERE tl.user.id = :userId AND t.project.id = :projectId")
    List<TimeLog> findByUserIdAndProjectId(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId
    );

    @Query("SELECT tl FROM TimeLog tl JOIN tl.task t WHERE tl.user.id = :userId AND t.project.id = :projectId AND tl.loggedAt BETWEEN :startTime AND :endTime")
    List<TimeLog> findByUserIdAndProjectIdAndLoggedAtBetween(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    boolean existsByTaskId(UUID taskId);

    List<TimeLog> findByUserId(UUID userId);

    List<TimeLog> findByUserIdAndLoggedAtBetween(UUID userId, LocalDateTime startTime, LocalDateTime endTime);

    List<TimeLog> findByTask(Task task);

    boolean existsByUserAndEndTimeIsNull(User user);

    List<TimeLog> findByUserIdAndProjectIsNull(UUID userId);

    List<TimeLog> findByProjectIdAndUserIdOrderByStartTimeDesc(UUID projectId, UUID userId);
}
