import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MemberService } from '../../../services/project-invitations/member.service';
import { ProjectContextService } from '../../../services/project-context.service';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ChangeRoleDialogComponent } from './change-role-dialog/change-role-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardModule } from '@angular/material/card';
import { MatFormField, MatLabel, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOption, MatCommonModule } from '@angular/material/core';
import { MatChip, MatChipRow, MatChipsModule } from '@angular/material/chips';
import { MatMenu, MatMenuTrigger, MatMenuModule } from '@angular/material/menu';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MemberActivityLogsComponent} from './member-activity-logs/member-activity-logs.component';
import {MyTasksComponent} from '../tasks/my-tasks/my-tasks.component';
import {
  MyTasksCreateTaskComponent
} from '../tasks/my-tasks/task-subtabs/my-tasks-create-task/my-tasks-create-task.component';
import {
  MyTasksStatisticsComponent
} from '../tasks/my-tasks/task-subtabs/my-tasks-statistics/my-tasks-statistics.component';
import {MyTasksTimeLogsComponent} from '../tasks/my-tasks/task-subtabs/my-tasks-time-logs/my-tasks-time-logs.component';
import {ProjectRoleService} from '../../../services/project-role.service';

@Component({
  selector: 'app-project-members',
  templateUrl: './project-members.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,

    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatIcon,
    MatMenuTrigger,
    MatProgressSpinner,
    MemberActivityLogsComponent,

  ],
  styleUrls: ['./project-members.component.scss']
})
export class ProjectMembersComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['user', 'status', 'email', 'lastActivity', 'role', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  stats: any = null;
  availableRoles = ['Owner', 'Admin', 'Manager', 'User'];
  isLoading = true;
  selectedRoles: string[] = [];
  currentFilter: string = '';
  activeTab: 'members' | 'members-logs' = 'members';
  currentUserRole: string = '';
  hasAdminAccess: boolean = false;

  @ViewChild(MatSort, {static: false}) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<any>;

  private subscriptions = new Subscription();

  constructor(
    private memberService: MemberService,
    private projectContextService: ProjectContextService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private projectRoleService: ProjectRoleService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
    this.initializeFilterPredicate();
    this.fetchCurrentUserRole();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'role':
          return this.getRoleHierarchyValue(item.role);
        case 'user':
          return item.user.name.toLowerCase();
        case 'email':
          return item.user.email.toLowerCase();
        case 'status':
          return item.status === 'Online' ? 1 : 0;
        case 'lastActivity':
          return item.lastActivityDate ? new Date(item.lastActivityDate).getTime() : 0;
        default:
          return item[property];
      }
    };

    setTimeout(() => {
      this.sortData({active: 'role', direction: 'desc'});
    });
  }

  setActiveTab(tab: 'members' | 'members-logs'): void {
    this.activeTab = tab;
  }

  private fetchCurrentUserRole(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.projectRoleService.fetchCurrentUserRole(projectId).subscribe(role => {
        this.currentUserRole = role;
        this.hasAdminAccess = ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
      });
    }
  }

  private getRoleHierarchyValue(role: string): number {
    const hierarchyMap: {[key: string]: number} = {
      'OWNER': 4,
      'ADMIN': 3,
      'MANAGER': 2,
      'USER': 1
    };
    return hierarchyMap[role.toUpperCase()] || 0;
  }

  private loadData(): void {
    this.isLoading = true;
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.memberService.initialize(projectId);
    }
  }


  private initializeFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any) => {
      const matchesRole = this.selectedRoles.length === 0 ||
        this.selectedRoles.some(role =>
          data.role.toLowerCase() === role.toLowerCase()
        );

      const matchesText = !this.currentFilter ||
        data.user.name.toLowerCase().includes(this.currentFilter) ||
        data.user.email.toLowerCase().includes(this.currentFilter);

      return matchesRole && matchesText;
    };
  }


  private setupSubscriptions(): void {
    this.subscriptions.add(
      this.memberService.members$.subscribe(members => {
        members.forEach(member => {
          if (member.role) {
            member.role = member.role.toUpperCase();
          }
        });

        members.sort((a, b) =>
          this.getRoleHierarchyValue(b.role) - this.getRoleHierarchyValue(a.role)
        );

        this.dataSource.data = members;
        this.calculateStats(members);
        this.isLoading = false;
      })
    );

    this.subscriptions.add(
      this.memberService.members$.subscribe(members => {
        members.sort((a, b) =>
          this.getRoleHierarchyValue(b.role) - this.getRoleHierarchyValue(a.role)
        );
        this.dataSource.data = members;
        this.calculateStats(members);
        this.isLoading = false;
      })
    );
  }

  private calculateStats(members: any[]): void {
    this.stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'Online').length,
      adminCount: members.filter(m => m.role === 'Admin').length
    };
  }







  refreshMembers(): void {
    this.loadData();
    this.snackBar.open('Member list refreshed', 'Close', { duration: 2000 });
  }


  changeRole(member: any): void {
    const dialogRef = this.dialog.open(ChangeRoleDialogComponent, {
      width: '400px',
      data: {
        member,
        currentRole: member.role,
        availableRoles: this.getAvailableRolesForCurrentUser()
      }
    });

    dialogRef.afterClosed().subscribe(newRole => {
      if (newRole && newRole !== member.role) {
        const projectId = this.projectContextService.getCurrentProjectId();
        if (!projectId) {
          this.snackBar.open('No project selected', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return;
        }

        this.memberService.changeProjectMemberRole(projectId, member.id, newRole).subscribe(
          () => {
            this.snackBar.open(`Role updated to ${newRole}`, 'Close', { duration: 3000 });
            this.refreshMembers();
          },
          error => {
            this.snackBar.open('Failed to update role: ' + error.error, 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        );
      }
    });
  }

  private getAvailableRolesForCurrentUser(): string[] {
    return ['ADMIN', 'MANAGER', 'USER'];
  }

  viewProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  removeMember(memberId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirm Removal',
        message: 'Are you sure you want to remove this member from the project?',
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const projectId = this.projectContextService.getCurrentProjectId();
        if (!projectId) {
          this.snackBar.open('No project selected', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return;
        }

        this.memberService.removeProjectMember(projectId, memberId).subscribe(
          () => {
            this.snackBar.open('Member removed successfully', 'Close', {
              duration: 3000
            });
            this.refreshMembers();
          },
          error => {
            this.snackBar.open('Failed to remove member: ' + error.error, 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        );
      }
    });
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  sortData(sortEvent: {active: string, direction: string}): void {
    if (!this.sort) return;

    if (sortEvent.active) {
      this.sort.active = sortEvent.active;
      this.sort.direction = sortEvent.direction as 'asc' | 'desc';
    }

    this.dataSource.sort = this.sort;
  }

  getNextSortDirection(column: string): string {
    if (!this.sort) return 'asc';
    return this.sort.active === column
      ? this.sort.direction === 'asc' ? 'desc' : 'asc'
      : 'asc';
  }

  filterByRole(roles: string[]): void {
    this.selectedRoles = roles;
    this.applyFilters();
  }

  applyFilter(event: Event): void {
    this.currentFilter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  private applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      roles: this.selectedRoles,
      search: this.currentFilter
    });
  }

  getSortIndicator(column: string): string {
    if (!this.sort) return '';
    if (this.sort.active === column) {
      return this.sort.direction === 'asc' ? '▲' : '▼';
    }
    return '';
  }

}
