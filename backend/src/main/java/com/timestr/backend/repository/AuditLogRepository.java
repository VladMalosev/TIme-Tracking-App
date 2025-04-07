package com.timestr.backend.repository;

import com.timestr.backend.model.AuditAction;
import com.timestr.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByProjectIdAndActionAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID projectId, AuditAction action, LocalDateTime cutoffDate);

    List<AuditLog> findByProjectIdAndCreatedAtAfterOrderByCreatedAtDesc(
            UUID projectId, LocalDateTime cutoffDate);

    List<AuditLog> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
