package com.timestr.backend.repository;

import com.timestr.backend.model.Activity;
import com.timestr.backend.model.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    void deleteByProjectId(UUID projectId);

    List<Activity> findByProjectIdAndTypeOrderByCreatedAtDesc(UUID projectId, ActivityType activityType);


    List<Activity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Activity> findByUserIdAndProjectIdOrderByCreatedAtDesc(UUID userId, UUID projectId);
}
