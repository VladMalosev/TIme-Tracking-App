package com.timestr.backend.controller;

import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.timestr.backend.dto.CustomReportRequest;
import com.timestr.backend.dto.TimeLogWithStatus;
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

import java.io.ByteArrayOutputStream;
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
    public ResponseEntity<List<TimeLogWithStatus>> generateTaskReport(
            @Parameter(description = "ID of the task", required = true)
            @RequestParam UUID taskId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);


        List<TimeLogWithStatus> report = reportService.generateTaskReport(taskId, start, end);
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
    public ResponseEntity<List<TimeLogWithStatus>> generateProjectReport(
            @Parameter(description = "ID of the project", required = true)
            @RequestParam UUID projectId,
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLogWithStatus> report = reportService.generateProjectReport(projectId, start, end);
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
    public ResponseEntity<List<TimeLogWithStatus>> generateUserReport(
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

        List<TimeLogWithStatus> report = reportService.generateUserReport(userId, projectId, start, end);
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

        List<TimeLogWithStatus> report = reportService.generateTaskReport(taskId, start, end);
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

        List<TimeLogWithStatus> report = reportService.generateProjectReport(projectId, start, end);
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

        List<TimeLogWithStatus> report = reportService.generateUserReport(userId, projectId, start, end);
        byte[] pdfBytes = pdfReportService.generateUserReport(report, userName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user_report.pdf")
                .body(pdfBytes);
    }

    @Operation(summary = "Generate user time logs report", description = "Generates a report for all time logs of the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping(value = "/user/timelogs", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('REPORT_GENERATE')")
    public ResponseEntity<List<TimeLogWithStatus>> generateUserTimeLogsReport(
            @Parameter(description = "Start time for the report (optional)", example = "2025-03-10T11:11:00")
            @RequestParam(required = false) String startTime,
            @Parameter(description = "End time for the report (optional)", example = "2025-03-12T11:11:00")
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        List<TimeLogWithStatus> report = reportService.generateUserTimeLogsReport(start, end);
        return ResponseEntity.ok(report);
    }

    @Operation (summary = "Generate custom PDF report", description = "Generates a custom PDF report based on provided data and filters.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/custom-pdf")
    public ResponseEntity<byte[]> generateCustomPDF(
            @RequestBody CustomReportRequest request) {

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);


            reportService.addReportHeader(document, request.getFilters());

            if (request.getFilters().getGroupBy() != null && !request.getFilters().getGroupBy().equals("none")) {
                reportService.addGroupedDataTable(document, request.getData(), request.getFilters().getGroupBy());
            } else {
                reportService.addDataTable(document, request.getData(), request.getSortColumn(), request.getSortDirection());
            }

            reportService.addSummary(document, request.getData());

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", reportService.generateFileName(request.getFilters()) + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(baos.toByteArray());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }


}