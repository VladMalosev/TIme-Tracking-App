import { Routes } from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {RegisterComponent} from './pages/register/register.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {AuthGuard} from './auth.guard';
import {ChatComponent} from './pages/chat/chat.component';
import {WorkspaceManagementComponent} from './pages/workspace-management/workspace-management.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'workspaces', component: WorkspaceManagementComponent, canActivate: [AuthGuard] },
  {path: '**', redirectTo: '/login'}
];
