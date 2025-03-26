import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {SelfTaskService} from '../../../../../services/my-tasks/self-task.service';
import {MatChip} from '@angular/material/chips';

@Component({
  selector: 'app-self-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatIconModule,
    FormsModule,
    MatChip
  ],
  templateUrl: './self-tasks.component.html',
  styleUrls: ['./self-tasks.component.scss']
})
export class SelfTasksComponent {
  projects: any[] = [];
  taskName: string = '';
  taskDescription: string = '';
  selectedProject: string = '';
  deadline?: Date;
  displayedColumns: string[] = ['name', 'project', 'description', 'status', 'deadline', 'actions'];
  tasks: any[] = [];


  constructor(private selfTaskService: SelfTaskService) {}

  createTask(): void {
    if (!this.taskName || !this.selectedProject) {
      return;
    }

    const taskData = {
      name: this.taskName,
      description: this.taskDescription,
      projectId: this.selectedProject,
      deadline: this.deadline
    };

    this.selfTaskService.createSelfTask(taskData).subscribe({
      next: (task) => {
        this.tasks = [...this.tasks, task];
        this.resetForm();
      },
      error: (err) => console.error('Error creating task:', err)
    });
  }



  updateTaskStatus(taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'): void {
    this.selfTaskService.updateTaskStatus(taskId, newStatus).subscribe({
      next: (updatedTask) => {
        this.tasks = this.tasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        );
      },
      error: (err) => console.error('Error updating task:', err)
    });
  }

  deleteTask(taskId: string): void {
    this.selfTaskService.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
      },
      error: (err) => console.error('Error deleting task:', err)
    });
  }

  private resetForm(): void {
    this.taskName = '';
    this.taskDescription = '';
    this.selectedProject = '';
    this.deadline = undefined;
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }
}
