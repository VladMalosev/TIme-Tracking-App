package com.timestr.backend.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.timestr.backend.dto.ReportFilters;
import com.timestr.backend.dto.TimeLogWithStatus;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.ProjectRepository;
import com.timestr.backend.repository.TaskRepository;
import com.timestr.backend.repository.TimeLogRepository;
import com.timestr.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;



@Service
public class ReportService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public List<TimeLogWithStatus> generateTaskReport(UUID taskId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByTaskId(taskId);
        } else {
            timeLogs = timeLogRepository.findByTaskIdAndLoggedAtBetween(taskId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(taskId).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateProjectReport(UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByProjectId(projectId);
        } else {
            timeLogs = timeLogRepository.findByProjectIdAndLoggedAtBetween(projectId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateUserReport(UUID userId, UUID projectId, LocalDateTime startTime, LocalDateTime endTime) {
        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByUserIdAndProjectId(userId, projectId);
        } else {
            timeLogs = timeLogRepository.findByUserIdAndProjectIdAndLoggedAtBetween(userId, projectId, startTime, endTime);
        }
        return timeLogs.stream()
                .map(timeLog -> new TimeLogWithStatus(timeLog, taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()))
                .collect(Collectors.toList());
    }

    public List<TimeLogWithStatus> generateUserTimeLogsReport(LocalDateTime startTime, LocalDateTime endTime) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UUID userId = user.getId();

        List<TimeLog> timeLogs;
        if (startTime == null || endTime == null) {
            timeLogs = timeLogRepository.findByUserId(userId);
        } else {
            timeLogs = timeLogRepository.findByUserIdAndLoggedAtBetween(userId, startTime, endTime);
        }

        return timeLogs.stream()
                .map(timeLog -> {
                    TaskStatus status = timeLog.getTask() != null
                            ? taskRepository.findById(timeLog.getTask().getId()).orElseThrow().getStatus()
                            : TaskStatus.PENDING;
                    return new TimeLogWithStatus(timeLog, status);
                })
                .collect(Collectors.toList());
    }

    public void addReportHeader(Document document, ReportFilters filters) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String currentDate = LocalDateTime.now().format(formatter);

        Paragraph title = new Paragraph("Time Tracking Report")
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        Paragraph date = new Paragraph("Generated on: " + currentDate)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(date);

        if (filters != null) {
            com.itextpdf.layout.element.List filterList = new com.itextpdf.layout.element.List()
                    .setSymbolIndent(12)
                    .setListSymbol("•")
                    .setFontSize(10);

            if (filters.getStartTime() != null) {
                filterList.add(new ListItem("From: " + formatDateTime(filters.getStartTime())));
            }
            if (filters.getEndTime() != null) {
                filterList.add(new ListItem("To: " + formatDateTime(filters.getEndTime())));
            }
            if (filters.getProjectId() != null) {
                Project project = projectRepository.findById(UUID.fromString(filters.getProjectId())).orElse(null);
                if (project != null) {
                    filterList.add(new ListItem("Project: " + project.getName()));
                }
            }
            if (filters.getUserId() != null) {
                User user = userRepository.findById(UUID.fromString(filters.getUserId())).orElse(null);
                if (user != null) {
                    filterList.add(new ListItem("User: " + user.getName()));
                }
            }
            if (filters.getTaskId() != null) {
                Task task = taskRepository.findById(UUID.fromString(filters.getTaskId())).orElse(null);
                if (task != null) {
                    filterList.add(new ListItem("Task: " + task.getName()));
                }
            }
            if (filters.getGroupBy() != null && !filters.getGroupBy().equals("none")) {
                filterList.add(new ListItem("Grouped by: " + filters.getGroupBy()));
            }

            document.add(filterList);
        }

        document.add(new Paragraph(" "));
    }

    public void addDataTable(Document document, List<Map<String, Object>> data, String sortColumn, String sortDirection) {
        if (data == null || data.isEmpty()) {
            document.add(new Paragraph("No data available for the selected filters.")
                    .setFontSize(9));
            return;
        }

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1, 3, 2, 2, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(createHeaderCell("Start Time"));
        table.addHeaderCell(createHeaderCell("End Time"));
        table.addHeaderCell(createHeaderCell("Duration (min)"));
        table.addHeaderCell(createHeaderCell("Description"));
        table.addHeaderCell(createHeaderCell("User"));
        table.addHeaderCell(createHeaderCell("Task"));
        table.addHeaderCell(createHeaderCell("Status"));

        for (Map<String, Object> row : data) {
            Map<String, Object> timeLog = (Map<String, Object>) row.get("timeLog");

            table.addCell(createCell(formatDateTime((String) timeLog.get("startTime"))));
            table.addCell(createCell(formatDateTime((String) timeLog.get("endTime"))));
            table.addCell(createCell(String.valueOf(timeLog.get("minutes"))));
            table.addCell(createCell((String) timeLog.get("description")));

            Map<String, Object> user = (Map<String, Object>) timeLog.get("user");
            table.addCell(createCell(user != null ? (String) user.get("name") : "N/A"));

            Map<String, Object> task = (Map<String, Object>) timeLog.get("task");
            table.addCell(createCell(task != null ? (String) task.get("name") : "N/A"));

            table.addCell(createCell((String) row.get("status")));
        }

        document.add(table);
    }

    public void addGroupedDataTable(Document document, List<Map<String, Object>> data, String groupBy) {
        if (data == null || data.isEmpty()) {
            document.add(new Paragraph("No data available for the selected filters.")
                    .setFontSize(9));
            return;
        }

        Map<String, List<Map<String, Object>>> groupedData = new HashMap<>();
        for (Map<String, Object> row : data) {
            Map<String, Object> timeLog = (Map<String, Object>) row.get("timeLog");
            String groupName = "Unknown";

            switch (groupBy) {
                case "task":
                    Map<String, Object> task = (Map<String, Object>) timeLog.get("task");
                    groupName = task != null ? (String) task.get("name") : "No Task";
                    break;
                case "user":
                    Map<String, Object> user = (Map<String, Object>) timeLog.get("user");
                    groupName = user != null ? (String) user.get("name") : "No User";
                    break;
                case "project":
                    Map<String, Object> project = (Map<String, Object>) timeLog.get("project");
                    groupName = project != null ? (String) project.get("name") : "No Project";
                    break;
            }

            if (!groupedData.containsKey(groupName)) {
                groupedData.put(groupName, new ArrayList<>());
            }
            groupedData.get(groupName).add(row);
        }

        for (Map.Entry<String, List<Map<String, Object>>> entry : groupedData.entrySet()) {
            String groupName = entry.getKey();
            List<Map<String, Object>> groupData = entry.getValue();

            Paragraph groupHeader = new Paragraph(getGroupLabel(groupBy) + ": " + groupName)
                    .setFontSize(10);
            document.add(groupHeader);

            int totalMinutes = groupData.stream()
                    .mapToInt(row -> ((Number) ((Map<String, Object>) row.get("timeLog")).get("minutes")).intValue())
                    .sum();

            Paragraph groupTotal = new Paragraph("Total Hours: " + formatMinutesToHours(totalMinutes))
                    .setFontSize(10);
            document.add(groupTotal);

            Table table = new Table(getTableColumnsForGroup(groupBy))
                    .setWidth(UnitValue.createPercentValue(100));

            addTableHeadersForGroup(table, groupBy);

            for (Map<String, Object> row : groupData) {
                addTableRowForGroup(table, row, groupBy);
            }

            document.add(table);
            document.add(new Paragraph(" "));
        }
    }

    private UnitValue[] getTableColumnsForGroup(String groupBy) {
        switch (groupBy) {
            case "user":
                return UnitValue.createPercentArray(new float[]{2, 2, 1, 3, 2, 1});
            case "task":
                return UnitValue.createPercentArray(new float[]{2, 2, 1, 3, 2, 1});
            case "project":
                return UnitValue.createPercentArray(new float[]{2, 2, 1, 3, 2, 2, 1});
            default:
                return UnitValue.createPercentArray(new float[]{2, 2, 1, 3, 2, 2, 1});
        }
    }

    private void addTableHeadersForGroup(Table table, String groupBy) {
        table.addHeaderCell(createHeaderCell("Start Time"));
        table.addHeaderCell(createHeaderCell("End Time"));
        table.addHeaderCell(createHeaderCell("Duration (min)"));
        table.addHeaderCell(createHeaderCell("Description"));

        if (!groupBy.equals("user")) {
            table.addHeaderCell(createHeaderCell("User"));
        }

        if (!groupBy.equals("task")) {
            table.addHeaderCell(createHeaderCell("Task"));
        }

        table.addHeaderCell(createHeaderCell("Status"));
    }

    private void addTableRowForGroup(Table table, Map<String, Object> row, String groupBy) {
        Map<String, Object> timeLog = (Map<String, Object>) row.get("timeLog");

        table.addCell(createCell(formatDateTime((String) timeLog.get("startTime"))));
        table.addCell(createCell(formatDateTime((String) timeLog.get("endTime"))));
        table.addCell(createCell(String.valueOf(timeLog.get("minutes"))));
        table.addCell(createCell((String) timeLog.get("description")));

        if (!groupBy.equals("user")) {
            Map<String, Object> user = (Map<String, Object>) timeLog.get("user");
            table.addCell(createCell(user != null ? (String) user.get("name") : "N/A"));
        }

        if (!groupBy.equals("task")) {
            Map<String, Object> task = (Map<String, Object>) timeLog.get("task");
            table.addCell(createCell(task != null ? (String) task.get("name") : "N/A"));
        }

        table.addCell(createCell((String) row.get("status")));
    }

    public void addSummary(Document document, List<Map<String, Object>> data) {
        if (data == null || data.isEmpty()) {
            return;
        }

        document.add(new Paragraph(" "));

        int totalMinutes = data.stream()
                .mapToInt(row -> ((Number) ((Map<String, Object>) row.get("timeLog")).get("minutes")).intValue())
                .sum();

        Paragraph summary = new Paragraph("Summary")
                .setFontSize(14);
        document.add(summary);

        Paragraph totalTime = new Paragraph("Total Time: " + formatMinutesToHours(totalMinutes))
                .setFontSize(9);
        document.add(totalTime);

        Paragraph totalRecords = new Paragraph("Total Records: " + data.size())
                .setFontSize(9);
        document.add(totalRecords);
    }

    private Cell createHeaderCell(String text) {
        Paragraph paragraph = new Paragraph(text)
                .setFontSize(10);
        Cell cell = new Cell().add(paragraph);
        cell.setBackgroundColor(ColorConstants.LIGHT_GRAY);
        cell.setPadding(5);
        return cell;
    }

    private Cell createCell(String text) {
        Paragraph paragraph = new Paragraph(text != null ? text : "")
                .setFontSize(9);
        Cell cell = new Cell().add(paragraph);
        cell.setPadding(5);
        return cell;
    }

    private String formatDateTime(String dateTimeStr) {
        if (dateTimeStr == null) return "N/A";
        try {
            LocalDateTime dateTime = LocalDateTime.parse(dateTimeStr);
            return dateTime.format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"));
        } catch (Exception e) {
            return dateTimeStr;
        }
    }

    private String formatMinutesToHours(int minutes) {
        int hours = minutes / 60;
        int remainingMinutes = minutes % 60;
        return hours + "h " + remainingMinutes + "m";
    }

    private String getGroupLabel(String groupBy) {
        switch (groupBy) {
            case "task":
                return "Task";
            case "user":
                return "User";
            case "project":
                return "Project";
            default:
                return "Group";
        }
    }

    public String generateFileName(ReportFilters filters) {
        String datePart = "";
        if (filters.getStartTime() != null || filters.getEndTime() != null) {
            datePart = "_" +
                    (filters.getStartTime() != null ? filters.getStartTime().substring(0, 10) : "start") +
                    "_to_" +
                    (filters.getEndTime() != null ? filters.getEndTime().substring(0, 10) : "end");
        }

        String prefix = "time_report";
        if (filters.getTaskId() != null) {
            Task task = taskRepository.findById(UUID.fromString(filters.getTaskId())).orElse(null);
            if (task != null) {
                prefix = "task_" + task.getName().replaceAll("\\s+", "_").toLowerCase();
            }
        } else if (filters.getUserId() != null) {
            User user = userRepository.findById(UUID.fromString(filters.getUserId())).orElse(null);
            if (user != null) {
                prefix = "user_" + user.getName().replaceAll("\\s+", "_").toLowerCase();
            }
        } else if (filters.getProjectId() != null) {
            Project project = projectRepository.findById(UUID.fromString(filters.getProjectId())).orElse(null);
            if (project != null) {
                prefix = "project_" + project.getName().replaceAll("\\s+", "_").toLowerCase();
            }
        }

        return prefix + datePart;
    }
}
