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
import java.util.Map;
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


    @Query("SELECT COALESCE(SUM(t.minutes), 0) FROM TimeLog t " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId)")
    Long sumMinutesByUserAndProject(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    @Query("SELECT MIN(t.startTime) FROM TimeLog t WHERE t.user.id = :userId")
    LocalDateTime findFirstLogDateByUser(@Param("userId") UUID userId);

    @Query("SELECT t.task.name as taskName, SUM(t.minutes) as minutes " +
            "FROM TimeLog t " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId) " +
            "AND t.task IS NOT NULL " +
            "GROUP BY t.task.name " +
            "ORDER BY minutes DESC")
    List<Map<String, Object>> getTaskTimeDistribution(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(t.minutes), 0) / 60.0 " +
            "FROM TimeLog t " +
            "JOIN t.task task " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId) " +
            "AND task.status = 'COMPLETED'")
    Double sumHoursOnCompletedTasks(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    @Query("SELECT HOUR(t.startTime) as hour, " +
            "CASE WHEN SUM(t.minutes) = 0 THEN NULL ELSE " +
            "   CAST(SUM(CASE WHEN t.task.status = 'COMPLETED' THEN t.minutes ELSE 0 END) AS double) / " +
            "   SUM(t.minutes) " +
            "END as efficiency " +
            "FROM TimeLog t " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId) " +
            "AND t.startTime IS NOT NULL " +
            "GROUP BY HOUR(t.startTime) " +
            "ORDER BY CASE WHEN SUM(t.minutes) = 0 THEN 0 ELSE " +
            "   CAST(SUM(CASE WHEN t.task.status = 'COMPLETED' THEN t.minutes ELSE 0 END) AS double) / " +
            "   SUM(t.minutes) END DESC NULLS LAST")
    List<Map<String, Object>> findPeakProductivityHours(@Param("userId") UUID userId, @Param("projectId") UUID projectId);


    @Query("SELECT HOUR(t.loggedAt) as hour, COUNT(t) as count " +
            "FROM TimeLog t " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId) " +
            "GROUP BY HOUR(t.loggedAt) " +
            "ORDER BY HOUR(t.loggedAt)")
    List<Map<String, Object>> findLogCreationHourlyDistribution(@Param("userId") UUID userId,
                                                                @Param("projectId") UUID projectId);

    @Query("SELECT FUNCTION('date_part', 'dow', t.loggedAt) as day_of_week, COUNT(t) as count " +
            "FROM TimeLog t " +
            "WHERE t.user.id = :userId " +
            "AND (:projectId IS NULL OR t.project.id = :projectId) " +
            "GROUP BY FUNCTION('date_part', 'dow', t.loggedAt) " +
            "ORDER BY FUNCTION('date_part', 'dow', t.loggedAt)")
    List<Map<String, Object>> findLogCreationDailyDistribution(@Param("userId") UUID userId,
                                                               @Param("projectId") UUID projectId);

    Optional<TimeLog> findByUserAndTaskIdAndEndTimeIsNull(User user, UUID taskId);

    @Query("SELECT t FROM TimeLog t WHERE t.user.id = :userId AND t.project.id = :projectId AND t.endTime IS NULL")
    Optional<TimeLog> findByUserIdAndProjectIdAndEndTimeIsNull(@Param("userId") UUID userId, @Param("projectId") UUID projectId);


}
