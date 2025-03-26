// task-subtabs.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTabsService } from '../../../../../services/task-tabs-service';

@Component({
  selector: 'app-task-subtabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-subtabs.component.html',
  styleUrls: ['./task-subtabs.component.scss']
})
export class TaskSubtabsComponent implements OnInit {
  activeTab = 'my-tasks';
  canAssignTasks = false;

  constructor(private taskTabsService: TaskTabsService) {}

  ngOnInit(): void {
    this.taskTabsService.activeTab$.subscribe(tab => {
      this.activeTab = tab;
    });

    this.taskTabsService.canAssignTasks$.subscribe(canAssign => {
      this.canAssignTasks = canAssign;
    });

    this.canAssignTasks = this.taskTabsService.getCurrentCanAssignTasks();
  }

  setActiveTab(tab: string): void {
    this.taskTabsService.setActiveTab(tab);
  }
}
