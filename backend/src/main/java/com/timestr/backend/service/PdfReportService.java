package com.timestr.backend.service;


import com.itextpdf.io.source.ByteArrayOutputStream;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.timestr.backend.model.TimeLog;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfReportService {

    public byte[] generateTaskReport(List<TimeLog> timeLogs, String taskName) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Task Report: " + taskName)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(18));

            Table table = new Table(5);
            table.addHeaderCell("Start Time");
            table.addHeaderCell("End Time");
            table.addHeaderCell("Duration (Minutes)");
            table.addHeaderCell("Description");
            table.addHeaderCell("User");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (TimeLog log : timeLogs) {
                table.addCell(log.getStartTime() != null ? log.getStartTime().format(formatter) : "N/A");
                table.addCell(log.getEndTime() != null ? log.getEndTime().format(formatter) : "N/A");
                table.addCell(String.valueOf(log.getMinutes()));
                table.addCell(log.getDescription());
                table.addCell(log.getUser().getName());
            }

            document.add(table);
            document.close();

            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateProjectReport(List<TimeLog> timeLogs, String projectName) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("Project Report: " + projectName)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18));

        Table table = new Table(5);
        table.addHeaderCell("Start Time");
        table.addHeaderCell("End Time");
        table.addHeaderCell("Duration (Minutes)");
        table.addHeaderCell("Description");
        table.addHeaderCell("User");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (TimeLog log : timeLogs) {
            table.addCell(log.getStartTime() != null ? log.getStartTime().format(formatter) : "N/A");
            table.addCell(log.getEndTime() != null ? log.getEndTime().format(formatter) : "N/A");
            table.addCell(String.valueOf(log.getMinutes()));
            table.addCell(log.getDescription());
            table.addCell(log.getUser().getName());
        }

        document.add(table);
        document.close();

        return outputStream.toByteArray();
    }

    public byte[] generateUserReport(List<TimeLog> timeLogs, String userName) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("User Report: " + userName)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18));

        Table table = new Table(5);
        table.addHeaderCell("Start Time");
        table.addHeaderCell("End Time");
        table.addHeaderCell("Duration (Minutes)");
        table.addHeaderCell("Description");
        table.addHeaderCell("Task");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (TimeLog log : timeLogs) {
            table.addCell(log.getStartTime().format(formatter));
            table.addCell(log.getEndTime() != null ? log.getEndTime().format(formatter) : "N/A");
            table.addCell(String.valueOf(log.getMinutes()));
            table.addCell(log.getDescription());
            table.addCell(log.getTask() != null ? log.getTask().getName() : "N/A");
        }

        document.add(table);
        document.close();

        return outputStream.toByteArray();
    }
}