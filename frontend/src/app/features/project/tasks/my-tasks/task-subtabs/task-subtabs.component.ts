import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTabsService } from '../../../../../services/task-tabs-service';
import { MyTasksComponent } from '../my-tasks.component';
import { MatIcon } from '@angular/material/icon';
import { MyTasksTimeLogsComponent } from './my-tasks-time-logs/my-tasks-time-logs.component';
import { MyTasksCreateTaskComponent } from './my-tasks-create-task/my-tasks-create-task.component';
import { MyTasksStatisticsComponent } from './my-tasks-statistics/my-tasks-statistics.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-task-subtabs',
  standalone: true,
  imports: [
    CommonModule,
    MyTasksComponent,
    MatIcon,
    MyTasksTimeLogsComponent,
    MyTasksCreateTaskComponent,
    MyTasksStatisticsComponent,
    RouterModule
  ],
  templateUrl: './task-subtabs.component.html',
  styleUrls: ['./task-subtabs.component.scss']
})
export class TaskSubtabsComponent implements OnInit {
  activeTab = 'my-tasks';
  nestedActiveTab = 'assigned-tasks';
  canAssignTasks = false;

  constructor(
    private taskTabsService: TaskTabsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['taskTab']) {
        this.activeTab = params['taskTab'];
        this.taskTabsService.setActiveTab(params['taskTab']);
      }

      if (params['subTab']) {
        this.nestedActiveTab = params['subTab'];
      } else if (this.activeTab === 'my-tasks') {
        this.nestedActiveTab = 'assigned-tasks';
      }
    });

    this.taskTabsService.canAssignTasks$.subscribe(canAssign => {
      this.canAssignTasks = canAssign;
    });

    this.canAssignTasks = this.taskTabsService.getCurrentCanAssignTasks();
  }


  setActiveTab(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { taskTab: tab },
      queryParamsHandling: 'merge'
    });
  }

  setNestedActiveTab(tab: string): void {
    this.nestedActiveTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subTab: tab },
      queryParamsHandling: 'merge'
    });
  }
}
