    package com.timestr.backend.service;

    import com.timestr.backend.model.Task;
    import com.timestr.backend.model.TimeLog;
    import com.timestr.backend.model.User;
    import com.timestr.backend.repository.TaskRepository;
    import com.timestr.backend.repository.TimeLogRepository;
    import com.timestr.backend.repository.UserRepository;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;

    import java.time.Duration;
    import java.time.LocalDateTime;
    import java.util.List;
    import java.util.UUID;

    @Service
    public class TimeLogService {

        @Autowired
        private TimeLogRepository timeLogRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private TaskRepository taskRepository;

        private static final Logger logger = LoggerFactory.getLogger(TimeLogService.class);

        public TimeLog startTimer(UUID userId, UUID taskId, String description) {
            logger.info("Starting timer for userId: {}, taskId: {}, description: {}", userId, taskId, description);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            TimeLog timeLog = new TimeLog();
            timeLog.setUser(user);

            if (taskId != null) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));
                timeLog.setTask(task);
            } else {
                logger.info("No task selected. Setting task to null.");
                timeLog.setTask(null);
            }

            timeLog.setStartTime(LocalDateTime.now());
            timeLog.setDescription(description != null ? description : "");
            timeLog.setMinutes(null);
            return timeLogRepository.save(timeLog);
        }


        public TimeLog stopTimer(UUID userId, UUID taskId) {
            logger.info("Stopping timer for userId: {}, taskId: {}", userId, taskId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            TimeLog timeLog;
            if (taskId != null) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));
                timeLog = timeLogRepository.findFirstByUserAndTaskAndEndTimeIsNullOrderByStartTimeDesc(user, task)
                        .orElseThrow(() -> new RuntimeException("No active timer found"));
            } else {
                timeLog = timeLogRepository.findFirstByUserAndTaskIsNullAndEndTimeIsNullOrderByStartTimeDesc(user)
                        .orElseThrow(() -> new RuntimeException("No active timer found"));
            }

            timeLog.setEndTime(LocalDateTime.now());
            long durationInMinutes = Duration.between(timeLog.getStartTime(), timeLog.getEndTime()).toMinutes();
            timeLog.setMinutes((int) durationInMinutes);
            return timeLogRepository.save(timeLog);
        }

        public TimeLog createManualTimeLog(UUID userId, UUID taskId, LocalDateTime startTime, LocalDateTime endTime, String description) {
            logger.info("Creating manual time log for userId: {}, taskId: {}, startTime: {}, endTime: {}, description: {}", userId, taskId, startTime, endTime, description);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            TimeLog timeLog = new TimeLog();
            timeLog.setUser(user);

            if (taskId != null) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));
                timeLog.setTask(task);
            } else {
                logger.info("No task selected. Setting task to null.");
                timeLog.setTask(null);
            }

            timeLog.setStartTime(startTime);
            timeLog.setEndTime(endTime);
            long durationInMinutes = Duration.between(startTime, endTime).toMinutes();
            timeLog.setMinutes((int) durationInMinutes);
            timeLog.setDescription(description != null ? description : "");
            return timeLogRepository.save(timeLog);
        }

        public List<TimeLog> getTimeLogsByUser(UUID userId) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return timeLogRepository.findByUser(user);
        }


        public boolean hasActiveTimer(UUID userId, UUID taskId) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (taskId != null) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));
                return timeLogRepository.existsByUserAndTaskAndEndTimeIsNull(user, task);
            } else {
                return timeLogRepository.existsByUserAndTaskIsNullAndEndTimeIsNull(user);
            }
        }
    }