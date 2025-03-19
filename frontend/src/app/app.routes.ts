import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterComponent } from './authentication/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './auth.guard';
import { ChatComponent } from './pages/chat/chat.component';
import { WorkspaceManagementComponent } from './pages/workspace-management/workspace-management.component';
import { AddProjectComponent } from './pages/workspace-management/add-project/add-project.component';
import { EditProjectComponent } from './pages/workspace-management/edit-project/edit-project.component';
import { ProjectComponent } from './pages/project/project.component';
import { ProjectMembersComponent } from './pages/project/project-members/project-members.component';
import {ProjectTasksComponent} from './pages/project/project-tasks/project-tasks.component';
import {ProjectInvitationsComponent} from './pages/project/project-invitations/project-invitations.component';
import {TimeLogsComponent} from './pages/project/time-logs/time-logs.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'add-project', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'workspaces', component: WorkspaceManagementComponent, canActivate: [AuthGuard] },
  { path: 'edit-project/:id', component: EditProjectComponent, canActivate: [AuthGuard] },
  {
    path: 'project-details/:id',
    component: ProjectComponent,
    children: [
      { path: 'members', component: ProjectMembersComponent },
      { path: 'tasks', component: ProjectTasksComponent },
      { path: 'invitations', component: ProjectInvitationsComponent },
      { path: 'time-logs', component: TimeLogsComponent },
      { path: '', redirectTo: 'members', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
