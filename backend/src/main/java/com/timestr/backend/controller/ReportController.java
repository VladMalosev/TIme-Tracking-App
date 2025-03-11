package com.timestr.backend.controller;

import com.timestr.backend.model.TimeLog;
import com.timestr.backend.service.PdfReportService;
import com.timestr.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {


    @Autowired
    private PdfReportService pdfReportService;

    @Autowired
    private ReportService reportService;

    @GetMapping(value = "/task", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateTaskReport(
            @RequestParam UUID taskId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateTaskReport(taskId, start, end);
        return ResponseEntity.ok(report);
    }

    @GetMapping(value = "/project", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateProjectReport(
            @RequestParam UUID projectId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateProjectReport(projectId, start, end);
        return ResponseEntity.ok(report);
    }

    @GetMapping(value = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateUserReport(
            @RequestParam UUID userId,
            @RequestParam UUID projectId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateUserReport(userId, projectId, start, end);
        return ResponseEntity.ok(report);
    }

    private LocalDateTime parseDateTime(String dateTime) {
        if (dateTime == null || dateTime.isEmpty()) {
            return null;
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        return LocalDateTime.parse(dateTime, formatter);
    }

    @GetMapping(value = "/task/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateTaskReportPdf(
            @RequestParam UUID taskId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam String taskName) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateTaskReport(taskId, start, end);
        byte[] pdfBytes = pdfReportService.generateTaskReport(report, taskName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=task_report.pdf")
                .body(pdfBytes);
    }

    @GetMapping(value = "/project/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateProjectReportPdf(
            @RequestParam UUID projectId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam String projectName) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateProjectReport(projectId, start, end);
        byte[] pdfBytes = pdfReportService.generateProjectReport(report, projectName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project_report.pdf")
                .body(pdfBytes);
    }

    @GetMapping(value = "/user/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateUserReportPdf(
            @RequestParam UUID userId,
            @RequestParam UUID projectId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam String userName) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateUserReport(userId, projectId, start, end);
        byte[] pdfBytes = pdfReportService.generateUserReport(report, userName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user_report.pdf")
                .body(pdfBytes);
    }

}