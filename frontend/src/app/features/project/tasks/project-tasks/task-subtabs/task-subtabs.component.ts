import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTabsService } from '../../../../../services/task-tabs-service';
import {MyTasksComponent} from '../../my-tasks/my-tasks.component';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-task-subtabs',
  standalone: true,
  imports: [
    CommonModule,
    MyTasksComponent,
    MatIcon,

  ],
  templateUrl: './task-subtabs.component.html',
  styleUrls: ['./task-subtabs.component.scss']
})
export class TaskSubtabsComponent implements OnInit {
  activeTab = 'my-tasks';
  nestedActiveTab = 'assigned-tasks';
  canAssignTasks = false;

  constructor(private taskTabsService: TaskTabsService) {}

  ngOnInit(): void {
    this.taskTabsService.activeTab$.subscribe(tab => {
      this.activeTab = tab;
      if (tab !== 'my-tasks') {
        this.nestedActiveTab = 'assigned-tasks';
      }
    });

    this.taskTabsService.canAssignTasks$.subscribe(canAssign => {
      this.canAssignTasks = canAssign;
    });

    this.canAssignTasks = this.taskTabsService.getCurrentCanAssignTasks();
  }

  setActiveTab(tab: string): void {
    this.taskTabsService.setActiveTab(tab);
  }

  setNestedActiveTab(tab: string): void {
    this.nestedActiveTab = tab;
  }
}
