package com.timestr.backend.dto;

import java.util.List;
import java.util.Map;

public class CustomReportRequest {
    private List<Map<String, Object>> data;
    private ReportFilters filters;
    private String sortColumn;
    private String sortDirection;

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }

    public ReportFilters getFilters() {
        return filters;
    }

    public void setFilters(ReportFilters filters) {
        this.filters = filters;
    }

    public String getSortColumn() {
        return sortColumn;
    }

    public void setSortColumn(String sortColumn) {
        this.sortColumn = sortColumn;
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }
}

