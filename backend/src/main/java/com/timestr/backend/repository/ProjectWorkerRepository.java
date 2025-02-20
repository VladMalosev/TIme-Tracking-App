package com.timestr.backend.repository;

import com.timestr.backend.model.ProjectWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectWorkerRepository extends JpaRepository<ProjectWorker, UUID> {
}
