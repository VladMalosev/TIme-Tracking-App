export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  deadline?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  assignedTo?: User;
  assignedBy?: User;
  project?: Project;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
}

export interface Project {
  id: string;
  name?: string;
  description?: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REOPENED = 'REOPENED'
}
