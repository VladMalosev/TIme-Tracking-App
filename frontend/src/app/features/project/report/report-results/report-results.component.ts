import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {ReportStateService} from '../../../../services/report/report-state.service';
import {ReportService} from '../../../../services/report/report.service';

interface GroupedReportData {
  groupName: string;
  logs: any[];
  subGroups?: GroupedReportData[];
  totalMinutes: number;
  expanded: boolean;
}

@Component({
  selector: 'app-report-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-results.component.html',
  styleUrls: ['./report-results.component.scss']
})
export class ReportResultsComponent implements OnInit, OnDestroy {
  reportData: any[] = [];
  groupedReportData: GroupedReportData[] = [];
  filter: any = {
    groupBy: 'none'
  };
  isLoading = false;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  exportAll: boolean = false;

  private reportDataSubscription?: Subscription;
  private filterSubscription?: Subscription;
  private isLoadingSubscription?: Subscription;

  constructor(
    private reportState: ReportStateService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.reportDataSubscription?.unsubscribe();
    this.filterSubscription?.unsubscribe();
    this.isLoadingSubscription?.unsubscribe();
  }

  private setupSubscriptions(): void {
    this.reportDataSubscription = this.reportState.reportData$.subscribe(data => {
      if (data) {
        this.reportData = data;
        if (this.filter.groupBy !== 'none') {
          this.groupReportData();
        }
      }
    });

    this.filterSubscription = this.reportState.filter$.subscribe(filter => {
      if (filter) {
        this.filter = filter;
        if (this.reportData.length > 0 && this.filter.groupBy !== 'none') {
          this.groupReportData();
        }
      }
    });

    this.isLoadingSubscription = this.reportState.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  groupReportData(): void {
    const groupMap = new Map<string, GroupedReportData>();

    // First level grouping (by the selected groupBy)
    this.reportData.forEach(log => {
      let groupName = '';
      switch (this.filter.groupBy) {
        case 'task': groupName = log.timeLog.task?.name || 'No Task'; break;
        case 'user': groupName = log.timeLog.user?.name || 'No User'; break;
        case 'project': groupName = log.timeLog.project?.name || 'No Project'; break;
      }

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, {
          groupName,
          logs: [],
          totalMinutes: 0,
          expanded: true
        });
      }

      const group = groupMap.get(groupName)!;
      group.logs.push(log);
      group.totalMinutes += log.timeLog.minutes || 0;
    });

    // If grouping by user, add second level grouping by task
    if (this.filter.groupBy === 'user') {
      groupMap.forEach((group) => {
        const taskMap = new Map<string, GroupedReportData>();

        group.logs.forEach(log => {
          const taskName = log.timeLog.task?.name || 'No Task';

          if (!taskMap.has(taskName)) {
            taskMap.set(taskName, {
              groupName: taskName,
              logs: [],
              totalMinutes: 0,
              expanded: true
            });
          }

          const taskGroup = taskMap.get(taskName)!;
          taskGroup.logs.push(log);
          taskGroup.totalMinutes += log.timeLog.minutes || 0;
        });

        group.subGroups = Array.from(taskMap.values());
        group.subGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));
      });
    }

    this.groupedReportData = Array.from(groupMap.values());
    this.sortGroupedData();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.filter.groupBy !== 'none') {
      this.sortGroupedData();
    } else {
      this.sortReportData();
    }
  }

  private sortReportData(): void {
    this.reportData.sort((a, b) => {
      const valueA = this.getPropertyValue(a, this.sortColumn);
      const valueB = this.getPropertyValue(b, this.sortColumn);

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private sortGroupedData(): void {
    this.groupedReportData.sort((a, b) => {
      if (this.sortColumn.includes(this.filter.groupBy)) {
        if (a.groupName < b.groupName) return this.sortDirection === 'asc' ? -1 : 1;
        if (a.groupName > b.groupName) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (a.totalMinutes < b.totalMinutes) return this.sortDirection === 'asc' ? -1 : 1;
        if (a.totalMinutes > b.totalMinutes) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

    this.groupedReportData.forEach(group => {
      group.logs.sort((a, b) => {
        const valueA = this.getPropertyValue(a, this.sortColumn);
        const valueB = this.getPropertyValue(b, this.sortColumn);

        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    });
  }

  private getPropertyValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  toggleGroupExpansion(group: GroupedReportData): void {
    group.expanded = !group.expanded;
  }

  exportToPDF(): void {
    this.isLoading = true;

    const dataToExport = this.filter.groupBy !== 'none'
      ? this.flattenGroupedData()
      : this.reportData;

    const startTime = this.filter.startDate ? `${this.filter.startDate}T00:00:00` : null;
    const endTime = this.filter.endDate ? `${this.filter.endDate}T23:59:59` : null;
    const fileName = this.generateReportFileName();

    this.reportService.generateCustomPdf(
      dataToExport,
      startTime,
      endTime,
      fileName,
      {
        ...this.filter,
        sortColumn: this.sortColumn,
        sortDirection: this.sortDirection
      }
    ).subscribe({
      next: (blob) => {
        this.handlePdfDownload(`${fileName}.pdf`)(blob);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error exporting PDF:', err);
        this.isLoading = false;
      }
    });
  }

  private handlePdfDownload(defaultFilename: string): (blob: Blob) => void {
    return (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  }

  exportToCSV(): void {
    const dataToExport = this.filter.groupBy !== 'none'
      ? this.flattenGroupedData()
      : this.reportData;

    let csvContent = "data:text/csv;charset=utf-8,";

    const headers = ['Start Time', 'End Time', 'Duration (min)', 'Description'];

    if (this.filter.groupBy !== 'user') {
      headers.push('User');
    }

    if (this.filter.groupBy !== 'task') {
      headers.push('Task');
    }

    headers.push('Status');
    csvContent += headers.join(",") + "\r\n";

    dataToExport.forEach(log => {
      const row = [
        new Date(log.timeLog.startTime).toLocaleString(),
        new Date(log.timeLog.endTime).toLocaleString(),
        log.timeLog.minutes,
        `"${log.timeLog.description?.replace(/"/g, '""') || ''}"`
      ];

      if (this.filter.groupBy !== 'user') {
        row.push(log.timeLog.user?.name || 'N/A');
      }

      if (this.filter.groupBy !== 'task') {
        row.push(log.timeLog.task?.name || 'N/A');
      }

      row.push(log.status);
      csvContent += row.join(",") + "\r\n";
    });

    this.downloadCSV(csvContent, `${this.generateReportFileName()}.csv`);
  }

  getTotalMinutes(): number {
    return this.reportData.reduce((sum, item) => sum + (item.timeLog.minutes || 0), 0);
  }

  private flattenGroupedData(): any[] {
    let flatData: any[] = [];
    this.groupedReportData.forEach(group => {
      if (group.expanded || this.exportAll) {
        if (group.subGroups) {
          group.subGroups.forEach(subGroup => {
            if (subGroup.expanded || this.exportAll) {
              flatData = flatData.concat(subGroup.logs);
            }
          });
        } else {
          flatData = flatData.concat(group.logs);
        }
      }
    });
    return flatData;
  }

  private generateReportFileName(): string {
    const datePart = this.filter.startDate || this.filter.endDate
      ? `_${this.filter.startDate || 'start'}_to_${this.filter.endDate || 'end'}`
      : '';

    if (this.filter.task) {
      return `task_${this.filter.task.name.replace(/\s+/g, '_').toLowerCase()}${datePart}`;
    } else if (this.filter.user) {
      return `user_${this.filter.user.name.replace(/\s+/g, '_').toLowerCase()}${datePart}`;
    } else if (this.filter.project) {
      return `project_${this.filter.project.name.replace(/\s+/g, '_').toLowerCase()}${datePart}`;
    } else {
      return `time_report${datePart}`;
    }
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getGroupLabel(): string {
    switch (this.filter.groupBy) {
      case 'task': return 'Task';
      case 'user': return 'User';
      case 'project': return 'Project';
      default: return 'Group';
    }
  }

  hasUsers(group: GroupedReportData): boolean {
    return group.logs.some(log => log.timeLog.user);
  }

  hasTasks(group: GroupedReportData): boolean {
    return group.logs.some(log => log.timeLog.task);
  }

  getUniqueUsers(group: GroupedReportData): string {
    const users = new Set<string>();
    group.logs.forEach(log => {
      if (log.timeLog.user?.name) {
        users.add(log.timeLog.user.name);
      }
    });
    return Array.from(users).join(', ');
  }

  getUniqueTasks(group: GroupedReportData): string {
    const tasks = new Set<string>();
    group.logs.forEach(log => {
      if (log.timeLog.task?.name) {
        tasks.add(log.timeLog.task.name);
      }
    });
    return Array.from(tasks).join(', ');
  }

  getStatusCount(group: GroupedReportData, status: string): number {
    return group.logs.filter(log => log.status === status).length;
  }

  getDominantStatus(group: any): string {
    const completed = this.getStatusCount(group, 'COMPLETED');
    const inProgress = this.getStatusCount(group, 'IN_PROGRESS');
    const pending = this.getStatusCount(group, 'PENDING');
    const reopened = this.getStatusCount(group, 'REOPENED');

    if (reopened > 0) return 'REOPENED';

    const max = Math.max(completed, inProgress, pending);

    if (max === completed) return 'COMPLETED';
    if (max === inProgress) return 'IN_PROGRESS';
    if (max === pending) return 'PENDING';

    return 'N/A';
  }

  getStatusClass(group: any): string {
    const status = this.getDominantStatus(group);
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'PENDING':
        return 'status-pending';
      case 'REOPENED':
        return 'status-reopened';
      default:
        return '';
    }
  }
}
