import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MemberService } from '../../../../services/project-invitations/member.service';
import { ProjectContextService } from '../../../../services/project-context.service';
import { ProjectRoleService } from '../../../../services/project-role.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';

@Component({
  selector: 'app-member-activity-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerToggle,
    MatDatepicker,
    MatDatepickerInput
  ],
  templateUrl: './member-activity-logs.component.html',
  styleUrls: ['./member-activity-logs.component.scss']
})
export class MemberActivityLogsComponent implements OnInit {
  activityLogs: any[] = [];
  filteredLogs: any[] = [];
  isLoading: boolean = true;
  hasAccess: boolean = false;

  searchControl = new FormControl('');
  logTypeControl = new FormControl('');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  logTypes = [
    { value: 'USER_INVITED', display: 'User Invited' },
    { value: 'ROLE_CHANGED', display: 'Role Changed' },
    { value: 'USER_REMOVED', display: 'User Removed' },
    { value: 'USER_JOINED', display: 'User Joined' },
    { value: 'USER_REJECTED', display: 'Invitation Rejected' },
    { value: 'INVITATION_REVOKED', display: 'Invitation Revoked' }
  ];

  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 100];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private memberService: MemberService,
    private projectContextService: ProjectContextService,
    private projectRoleService: ProjectRoleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkAccess();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.subscribe(() => this.filterLogs());
    this.logTypeControl.valueChanges.subscribe(() => this.filterLogs());
    this.startDateControl.valueChanges.subscribe(() => this.filterLogs());
    this.endDateControl.valueChanges.subscribe(() => this.filterLogs());
  }

  private filterLogs(): void {
    setTimeout(() => { // Wrap in setTimeout
      const searchTerm = this.searchControl.value?.toLowerCase() || '';
      const selectedLogType = this.logTypeControl.value;
      const startDate = this.startDateControl.value;
      const endDate = this.endDateControl.value;

      this.filteredLogs = this.activityLogs.filter(log => {
        if (selectedLogType && log.action !== selectedLogType) {
          return false;
        }

        const logDate = new Date(log.timestamp);
        if (startDate && logDate < startDate) {
          return false;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (logDate > endOfDay) {
            return false;
          }
        }

        const matchesSearch =
          (log.targetUser?.name?.toLowerCase().includes(searchTerm)) ||
          (log.initiator?.name?.toLowerCase().includes(searchTerm)) ||
          (log.description?.toLowerCase().includes(searchTerm)) ||
          (this.getLogMessage(log).toLowerCase().includes(searchTerm));

        return matchesSearch;
      });

      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.cdr.detectChanges();
    });
  }

  clearDateFilters(): void {
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
  }

  private checkAccess(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.projectRoleService.fetchCurrentUserRole(projectId).subscribe(role => {
        this.hasAccess = ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
        if (this.hasAccess) {
          this.loadActivityLogs();
        }
      });
    }
  }

  private loadActivityLogs(): void {
    this.isLoading = true;
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.memberService.getMemberActivityLogs(projectId).subscribe({
        next: (logs) => {
          setTimeout(() => {
            this.activityLogs = logs;
            this.filteredLogs = [...logs];
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          setTimeout(() => {
            console.error('Failed to load activity logs', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  getPaginatedLogs(): any[] {
    if (!this.paginator) {
      return this.filteredLogs;
    }

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return this.filteredLogs.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  refreshLogs(): void {
    this.loadActivityLogs();
  }

  getLogIcon(action: string): string {
    switch (action) {
      case 'USER_INVITED': return 'person_add';
      case 'ROLE_CHANGED': return 'swap_horiz';
      case 'USER_REMOVED': return 'person_remove';
      case 'USER_JOINED': return 'person_add_alt';
      case 'USER_REJECTED': return 'do_not_disturb_on';
      case 'INVITATION_REVOKED': return 'cancel';
      default: return 'info';
    }
  }

  getLogIconClass(action: string): string {
    switch (action) {
      case 'USER_INVITED': return 'invitation-log';
      case 'ROLE_CHANGED': return 'role-change-log';
      case 'USER_REMOVED': return 'removal-log';
      case 'USER_JOINED': return 'joined-log';
      case 'USER_REJECTED': return 'rejected-log';
      case 'INVITATION_REVOKED': return 'revoked-log';
      default: return '';
    }
  }

  getLogMessage(log: any): string {
    switch (log.action) {
      case 'USER_INVITED':
        return `${log.targetUser.name} was invited to the project`;
      case 'ROLE_CHANGED':
        return `${log.targetUser.name}'s role changed from ${log.oldValue} to ${log.newValue}`;
      case 'USER_REMOVED':
        return `${log.targetUser.name} was removed from the project`;
      case 'USER_JOINED':
        return `${log.targetUser.name} joined the project`;
      case 'USER_REJECTED':
        return `${log.targetUser.name} declined the invitation`;
      case 'INVITATION_REVOKED':
        return `Invitation for ${log.targetUser.name} was revoked`;
      default:
        return log.description || 'Project activity';
    }
  }
}
