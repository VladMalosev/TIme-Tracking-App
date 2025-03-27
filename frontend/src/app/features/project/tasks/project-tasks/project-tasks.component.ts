  import { Component, Input, OnInit } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { MatButtonModule } from '@angular/material/button';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatIconModule } from '@angular/material/icon';
  import { MatTableModule } from '@angular/material/table';
  import { MatCardModule } from '@angular/material/card';
  import {TaskLogComponent} from './tasklog/tasklog.component';
  import {forkJoin} from 'rxjs';
  import {MatCheckbox, MatCheckboxChange} from '@angular/material/checkbox';
  import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
  import {MatOption} from '@angular/material/core';
  import {MatSelect} from '@angular/material/select';
  import {TaskLogService} from '../../../../services/project-tasks/task-log.service';
  import {ProjectTasksService} from '../../../../services/project-tasks/project-tasks.service';
  import {MatDivider} from '@angular/material/divider';


  @Component({
    selector: 'app-project-tasks',
    imports: [
      CommonModule,
      FormsModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatTableModule,
      MatCardModule,
      TaskLogComponent,
      MatCheckbox,
      MatOption,
      MatDatepickerToggle,
      MatDatepicker,
      MatDatepickerInput,
      MatSelect,
      MatDivider
    ],
    templateUrl: './project-tasks.component.html',
    styleUrl: './project-tasks.component.scss'


  })
  export class ProjectTasksComponent implements OnInit {
    errorMessage: string | null = null;
    selectedTask: any = null;
    tasks: any[] = [];
    timeNotSelectedError: boolean = false;
    selectedTasks: any[] = [];
    nameFilter: string = '';
    statusFilter: string = '';
    assignedToFilter: string = '';
    createdByFilter: string = '';
    dateFrom: Date | null = null;
    dateTo: Date | null = null;
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';
    showFilters: boolean = false;
    currentUserRole: string = '';
    currentProjectId: string = '';


    constructor(
      private http: HttpClient,
      private projectTasksService: ProjectTasksService,
      private taskLogService: TaskLogService
    ) {}


    ngOnInit(): void {
      this.projectTasksService.currentUserRole$.subscribe(role => {
        this.currentUserRole = role;
      });

      this.projectTasksService.projectId$.subscribe(projectId => {
        if (projectId) {
          this.currentProjectId = projectId;
          this.loadTasks();
        }
      });
    }

    toggleFilters(): void {
      this.showFilters = !this.showFilters;
    }

    get filteredTasks() {
      let filtered = this.tasks.filter(task => {
        if (this.nameFilter &&
          !task.name.toLowerCase().includes(this.nameFilter.toLowerCase())) {
          return false;
        }

        if (this.statusFilter && task.status !== this.statusFilter) {
          return false;
        }

        if (this.assignedToFilter &&
          (!task.assignedTo?.name ||
            !task.assignedTo.name.toLowerCase().includes(this.assignedToFilter.toLowerCase()))) {
          return false;
        }

        if (this.createdByFilter &&
          (!task.createdBy?.name ||
            !task.createdBy.name.toLowerCase().includes(this.createdByFilter.toLowerCase()))) {
          return false;
        }

        if (this.dateFrom) {
          const taskDate = new Date(task.createdAt);
          if (taskDate < this.dateFrom) {
            return false;
          }
        }

        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setDate(toDate.getDate() + 1);
          const taskDate = new Date(task.createdAt);
          if (taskDate > toDate) {
            return false;
          }
        }

        return true;
      });

      if (this.sortColumn) {
        filtered = [...filtered].sort((a, b) => {
          const valueA = this.getSortableValue(a, this.sortColumn);
          const valueB = this.getSortableValue(b, this.sortColumn);

          if (valueA < valueB) {
            return this.sortDirection === 'asc' ? -1 : 1;
          } else if (valueA > valueB) {
            return this.sortDirection === 'asc' ? 1 : -1;
          } else {
            return 0;
          }
        });
      }

      return filtered;
    }

    getSortableValue(task: any, column: string): any {
      switch(column) {
        case 'name':
          return task.name;
        case 'status':
          return task.status;
        case 'assignedTo':
          return task.assignedTo?.name || '';
        case 'createdBy':
          return task.createdBy?.name || '';
        case 'deadline':
          return task.deadline || '';
        case 'createdAt':
          return new Date(task.createdAt).getTime();
        default:
          return '';
      }
    }

    sortData(column: string): void {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    }

    getSortIndicator(column: string): string {
      if (this.sortColumn === column) {
        return this.sortDirection === 'asc' ? '▲' : '▼';
      }
      return '';
    }

    resetFilters(): void {
      this.nameFilter = '';
      this.statusFilter = '';
      this.assignedToFilter = '';
      this.createdByFilter = '';
      this.dateFrom = null;
      this.dateTo = null;
      this.sortColumn = '';
      this.sortDirection = 'asc';
    }

    toggleSelectAll(event: MatCheckboxChange): void {
      this.tasks.forEach(task => task.selected = event.checked);
      this.updateSelection();
    }

    allSelected(): boolean {
      return this.tasks.length > 0 && this.tasks.every(task => task.selected);
    }

    someSelected(): boolean {
      return this.tasks.some(task => task.selected) && !this.allSelected();
    }

    updateSelection(): void {
      this.selectedTasks = this.tasks.filter(task => task.selected);
    }

    hasSelectedTasks(): boolean {
      return this.selectedTasks.length > 0;
    }

    hasCompletedTasksSelected(): boolean {
      return this.selectedTasks.some(task => task.status === 'COMPLETED');
    }

    deleteSelectedTasks(): void {
      const deletableTasks = this.selectedTasks.filter(task => task.status !== 'COMPLETED');

      if (deletableTasks.length === 0) {
        this.errorMessage = 'No deletable tasks selected (completed tasks cannot be deleted)';
        return;
      }

      if (confirm(`Are you sure you want to delete ${deletableTasks.length} selected tasks?`)) {
        const deleteObservables = deletableTasks.map(task =>
          this.http.delete(`http://localhost:8080/api/tasks/${task.id}`, {withCredentials: true})
        );

        forkJoin(deleteObservables).subscribe({
          next: () => {
            const deletedIds = new Set(deletableTasks.map(t => t.id));
            this.tasks = this.tasks.filter(task => !deletedIds.has(task.id));
            this.selectedTasks = [];
            this.errorMessage = null;
          },
          error: (error) => {
            console.error('Error deleting tasks', error);
            if (error.error?.message?.includes('Cannot delete a completed task')) {
              this.errorMessage = 'Cannot delete completed tasks';
            } else {
              this.errorMessage = 'Failed to delete some tasks';
            }
            this.loadTasks();
          }
        });
      }
    }

    deleteTask(task: any): void {
      if (task.status === 'COMPLETED') {
        this.errorMessage = 'Cannot delete completed tasks';
        return;
      }

      if (confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
        this.http.delete(`http://localhost:8080/api/tasks/${task.id}`, { withCredentials: true })
          .subscribe({
            next: () => {
              this.tasks = this.tasks.filter(t => t.id !== task.id);
              this.selectedTasks = this.selectedTasks.filter(t => t.id !== task.id);
              if (this.selectedTask?.id === task.id) {
                this.selectedTask = null;
                this.taskLogService.clear();
              }
              this.errorMessage = null;
            },
            error: (error) => {
              console.error('Error deleting task', error);
              if (error.error?.message?.includes('Cannot delete a completed task')) {
                this.errorMessage = 'Cannot delete completed tasks';
              } else {
                this.errorMessage = 'Failed to delete the task';
              }
              this.loadTasks();
            }
          });
      }
    }

    loadTasks(): void {
      this.projectTasksService.projectId$.subscribe(projectId => {
        if (!projectId) return;

        this.projectTasksService.loadTasks(projectId).subscribe(
          (tasks) => {
            this.tasks = tasks.map(task => ({
              ...task,
              selected: false,
              createdBy: task.createdBy || { name: 'System' },
              assignedTo: task.assignedTo || null,
              assignedBy: task.assignedBy || null
            }));
          },
          (error) => {
            console.error('Error loading tasks', error);
          }
        );
      });
    }

    onTaskSelected(task: any): void {
      if (this.selectedTask && this.selectedTask.id === task.id) {
        this.selectedTask = null;
        this.taskLogService.clear();
      } else {
        this.selectedTask = task;
        this.loadTaskLogs(task.id);
      }
    }

    loadTaskLogs(taskId: string): void {
      this.http.get<any[]>(
        `http://localhost:8080/api/tasks/${taskId}/logs`,
        { withCredentials: true }
      ).subscribe(
        (logs) => {
          this.taskLogService.setTask(this.selectedTask);
          this.taskLogService.setLogs(logs);
        },
        (error) => {
          console.error('Error loading task logs', error);
        }
      );
    }

    validateDeadlineTime(deadlineValue: string): void {
      if (deadlineValue) {
        const date = new Date(deadlineValue);
        this.timeNotSelectedError = date.getHours() === 0 && date.getMinutes() === 0;
      } else {
        this.timeNotSelectedError = false;
      }
    }

    createTask(name: string, description: string, deadlineInput: string): void {
      if (deadlineInput) {
        const date = new Date(deadlineInput);
        if (date.getHours() === 0 && date.getMinutes() === 0) {
          this.errorMessage = 'Please specify both date and time for the deadline';
          return;
        }
      }

      const task: any = {
        name: name,
        description: description,
        status: 'PENDING'
      };

      if (deadlineInput) {
        task.deadline = new Date(deadlineInput).toISOString();
      }

      this.http.post<any>(
        `http://localhost:8080/api/tasks?projectId=${this.currentProjectId}`,
        task,
        { withCredentials: true }
      ).subscribe(
        (response) => {
          alert('Task created successfully!');
          this.errorMessage = null;
          this.timeNotSelectedError = false;
          this.loadTasks();
        },
        (error) => {
          console.error('Error creating task', error);
          this.errorMessage = 'Failed to create task.';
        }
      );
    }


    canManageRole(targetRole: string): boolean {
      const roleHierarchy: { [key: string]: string[] } = {
        'OWNER': ['ADMIN', 'MANAGER', 'USER'],
        'ADMIN': ['MANAGER', 'USER'],
        'MANAGER': ['USER'],
        'USER': []
      };
      return roleHierarchy[this.currentUserRole]?.includes(targetRole);
    }
  }
