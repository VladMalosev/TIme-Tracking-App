package com.timestr.backend.controller;

import com.timestr.backend.model.TimeLog;
import com.timestr.backend.service.PdfReportService;
import com.timestr.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Reports", description = "Endpoints for generating and downloading reports")
public class ReportController {


    @Autowired
    private PdfReportService pdfReportService;

    @Autowired
    private ReportService reportService;

    @Operation(summary = "Generate task report", description = "Generates a report for a specific task.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/task", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateTaskReport(
            @Parameter(description = "ID of the task", required = true)
            @RequestParam UUID taskId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateTaskReport(taskId, start, end);
        return ResponseEntity.ok(report);
    }

    @Operation(summary = "Generate project report", description = "Generates a report for a specific project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/project", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateProjectReport(
            @Parameter(description = "ID of the project", required = true)
            @RequestParam UUID projectId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateProjectReport(projectId, start, end);
        return ResponseEntity.ok(report);
    }

    @Operation(summary = "Generate user report", description = "Generates a report for a specific user in a project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLog>> generateUserReport(
            @Parameter(description = "ID of the user", required = true)
            @RequestParam UUID userId,
            @Parameter(description = "ID of the project", required = true)
            @RequestParam UUID projectId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
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

    @Operation(summary = "Download task report as PDF", description = "Downloads a task report as a PDF file.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/task/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateTaskReportPdf(
            @Parameter(description = "ID of the task", required = true)
            @RequestParam UUID taskId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime,
            @Parameter(description = "Name of the task", required = true)
            @RequestParam String taskName) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateTaskReport(taskId, start, end);
        byte[] pdfBytes = pdfReportService.generateTaskReport(report, taskName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=task_report.pdf")
                .body(pdfBytes);
    }

    @Operation(summary = "Download project report as PDF", description = "Downloads a project report as a PDF file.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/project/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateProjectReportPdf(
            @Parameter(description = "ID of the project", required = true)
            @RequestParam UUID projectId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime,
            @Parameter(description = "Name of the project", required = true)
            @RequestParam String projectName) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLog> report = reportService.generateProjectReport(projectId, start, end);
        byte[] pdfBytes = pdfReportService.generateProjectReport(report, projectName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project_report.pdf")
                .body(pdfBytes);
    }

    @Operation(summary = "Download user report as PDF", description = "Downloads a user report as a PDF file.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/user/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<byte[]> generateUserReportPdf(
            @Parameter(description = "ID of the user", required = true)
            @RequestParam UUID userId,
            @Parameter(description = "ID of the project", required = true)
            @RequestParam UUID projectId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
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