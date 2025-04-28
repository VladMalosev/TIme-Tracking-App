import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/auth/auth.guard';
import { ChatComponent } from './features/chat/chat.component';
import { WorkspaceManagementComponent } from './features/workspace-management/workspace-management.component';
import { AddProjectComponent } from './features/workspace-management/workspace-management-add-project/add-project.component';
import { EditProjectComponent } from './features/workspace-management/workspace-management-edit-project/edit-project.component';
import { ProjectComponent } from './features/project/project.component';
import { ProjectMembersComponent } from './features/project/project-members/project-members.component';
import {ProjectTasksComponent} from './features/project/tasks/project-tasks/project-tasks.component';
import {ProjectInvitationsComponent} from './features/project/project-invitations/project-invitations.component';
import {TimeLogsComponent} from './features/project/time-logs/time-logs.component';
import {TaskDetailsComponent} from './features/project/tasks/my-tasks/task-details/task-details.component';
import {NoAuthGuard} from './core/auth/no-auth.guard';
import {RedirectComponent} from './core/auth/redirect-component/redirect-component.component';
import {UserPageComponent} from './features/user-page/user-page.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [NoAuthGuard]
  },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'add-project', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'workspaces', component: WorkspaceManagementComponent, canActivate: [AuthGuard] },
  { path: 'edit-project/:id', component: EditProjectComponent, canActivate: [AuthGuard] },
  { path: 'user/:id', component: UserPageComponent, canActivate: [AuthGuard] },
  {
    path: 'project-details/:id',
    component: ProjectComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: ProjectComponent },
      { path: 'members', component: ProjectMembersComponent },
      { path: 'tasks', component: ProjectTasksComponent },
      { path: 'invitations', component: ProjectInvitationsComponent },
      { path: 'time-logs', component: TimeLogsComponent },
      { path: 'task/:taskId', component: TaskDetailsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', component: RedirectComponent }
];
