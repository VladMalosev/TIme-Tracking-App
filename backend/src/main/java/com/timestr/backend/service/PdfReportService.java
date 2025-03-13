package com.timestr.backend.service;

import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.timestr.backend.dto.TimeLogWithStatus;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfReportService {

    public byte[] generateTaskReport(List<TimeLogWithStatus> timeLogs, String taskName) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Task Report: " + taskName)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18));

            // Add a table with 6 columns (including Status)
            Table table = new Table(6);
            table.addHeaderCell("Start Time");
            table.addHeaderCell("End Time");
            table.addHeaderCell("Duration (Minutes)");
            table.addHeaderCell("Description");
            table.addHeaderCell("User");
            table.addHeaderCell("Status");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (TimeLogWithStatus logWithStatus : timeLogs) {
                table.addCell(logWithStatus.getTimeLog().getStartTime() != null ? logWithStatus.getTimeLog().getStartTime().format(formatter) : "N/A");
                table.addCell(logWithStatus.getTimeLog().getEndTime() != null ? logWithStatus.getTimeLog().getEndTime().format(formatter) : "N/A");
                table.addCell(String.valueOf(logWithStatus.getTimeLog().getMinutes()));
                table.addCell(logWithStatus.getTimeLog().getDescription());
                table.addCell(logWithStatus.getTimeLog().getUser().getName());
                table.addCell(logWithStatus.getStatus().toString()); // Add the task status
            }

            document.add(table);
            document.close();

            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateProjectReport(List<TimeLogWithStatus> timeLogs, String projectName) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Project Report: " + projectName)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18));

            // Add a table with 6 columns (including Status)
            Table table = new Table(6);
            table.addHeaderCell("Start Time");
            table.addHeaderCell("End Time");
            table.addHeaderCell("Duration (Minutes)");
            table.addHeaderCell("Description");
            table.addHeaderCell("User");
            table.addHeaderCell("Status");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (TimeLogWithStatus logWithStatus : timeLogs) {
                table.addCell(logWithStatus.getTimeLog().getStartTime() != null ? logWithStatus.getTimeLog().getStartTime().format(formatter) : "N/A");
                table.addCell(logWithStatus.getTimeLog().getEndTime() != null ? logWithStatus.getTimeLog().getEndTime().format(formatter) : "N/A");
                table.addCell(String.valueOf(logWithStatus.getTimeLog().getMinutes()));
                table.addCell(logWithStatus.getTimeLog().getDescription());
                table.addCell(logWithStatus.getTimeLog().getUser().getName());
                table.addCell(logWithStatus.getStatus().toString()); // Add the task status
            }

            document.add(table);
            document.close();

            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateUserReport(List<TimeLogWithStatus> timeLogs, String userName) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("User Report: " + userName)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18));

            // Add a table with 6 columns (including Status)
            Table table = new Table(6);
            table.addHeaderCell("Start Time");
            table.addHeaderCell("End Time");
            table.addHeaderCell("Duration (Minutes)");
            table.addHeaderCell("Description");
            table.addHeaderCell("Task");
            table.addHeaderCell("Status");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (TimeLogWithStatus logWithStatus : timeLogs) {
                table.addCell(logWithStatus.getTimeLog().getStartTime() != null ? logWithStatus.getTimeLog().getStartTime().format(formatter) : "N/A");
                table.addCell(logWithStatus.getTimeLog().getEndTime() != null ? logWithStatus.getTimeLog().getEndTime().format(formatter) : "N/A");
                table.addCell(String.valueOf(logWithStatus.getTimeLog().getMinutes()));
                table.addCell(logWithStatus.getTimeLog().getDescription());
                table.addCell(logWithStatus.getTimeLog().getTask() != null ? logWithStatus.getTimeLog().getTask().getName() : "N/A");
                table.addCell(logWithStatus.getStatus().toString()); // Add the task status
            }

            document.add(table);
            document.close();

            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}