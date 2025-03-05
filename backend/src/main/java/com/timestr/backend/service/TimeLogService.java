package com.timestr.backend.service;

import com.timestr.backend.model.TimeLog;
import com.timestr.backend.model.User;
import com.timestr.backend.repository.TimeLogRepository;
import com.timestr.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TimeLogService {

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private UserRepository userRepository;

    public TimeLog startTimer(UUID userId, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeLog timeLog = new TimeLog();
        timeLog.setUser(user);
        timeLog.setStartTime(LocalDateTime.now());
        timeLog.setDescription(description != null ? description : "");
        timeLog.setMinutes(null);
        return timeLogRepository.save(timeLog);
    }

    public TimeLog stopTimer(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeLog timeLog = timeLogRepository.findFirstByUserAndEndTimeIsNullOrderByStartTimeDesc(user)
                .orElseThrow(() -> new RuntimeException("No active timer found"));

        timeLog.setEndTime(LocalDateTime.now());
        long durationInMinutes = java.time.Duration.between(timeLog.getStartTime(), timeLog.getEndTime()).toMinutes();
        timeLog.setMinutes((int) durationInMinutes);
        return timeLogRepository.save(timeLog);
    }


    public TimeLog createManualTimeLog(UUID userId, LocalDateTime startTime, LocalDateTime endTime, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TimeLog timeLog = new TimeLog();
        timeLog.setUser(user);
        timeLog.setStartTime(startTime);
        timeLog.setEndTime(endTime);
        long durationInMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        timeLog.setMinutes((int) durationInMinutes);
        timeLog.setDescription(description != null ? description : "");
        return timeLogRepository.save(timeLog);
    }

    public List<TimeLog> getTimeLogsByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return timeLogRepository.findByUser(user);
    }
}