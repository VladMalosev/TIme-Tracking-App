# Time Tracking App

A comprehensive multi-user time tracking platform with role-based access control, JWT authentication, and OAuth authorization.

## Overview

This project is a robust time tracking application that enables organizations to efficiently manage projects, tasks, and work hours. Designed with multiple user roles and workspaces, it provides a complete solution for time management and productivity tracking.

### Key Features

- **Workspace Management**: Create dedicated workspaces for teams or departments
- **Role-Based Access Control**: Assign different permission levels (Owner, Admin, Manager, User)
- **Project & Task Management**: Organize work into projects and tasks
- **Time Tracking**: Log and monitor time spent on tasks and projects
- **Reporting**: Generate comprehensive reports on time allocation and productivity
- **Collaboration**: Invite users to workspaces with specific roles
- **Audit Logging**: Track all system activities for accountability

## Screenshots

### Landing Page
![img_1.png](img_1.png)
![img_2.png](img_2.png)
![img_3.png](img_3.png)
![img_4.png](img_4.png)
![img_5.png](img_5.png)

### Register and Login pages
![img_6.png](img_6.png)
![img_7.png](img_7.png)

### Dashboard
![img_8.png](img_8.png)
![img_9.png](img_9.png)
*Main dashboard showing workspace overview and recent activities*

### Workspace Management
![img_11.png](img_11.png)

### Project Management
![img_12.png](img_12.png)
![img_13.png](img_13.png)

*Members tab*
![img_14.png](img_14.png)
![img_14.png](img_14.png)
![img_15.png](img_15.png)

*Tasks tab*
![img_16.png](img_16.png)
![img_17.png](img_17.png)
![img_18.png](img_18.png)

![img_19.png](img_19.png)
![img_20.png](img_20.png)

![img_21.png](img_21.png)

![img_22.png](img_22.png)
![img_23.png](img_23.png)

*Task creation tab for admins*
![img_24.png](img_24.png)
![img_25.png](img_25.png)

*Task assignment tab for admins*
![img_26.png](img_26.png)
![img_27.png](img_27.png)

*Report generation tab*
![img_28.png](img_28.png)

### Prerequisites

- Java 17 or higher
- Maven
- Docker and Docker Compose
- PostgreSQL (if running without Docker)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/VladMalosev/TIme-Tracking-App.git
cd Time-Tracking-App
```

#### 2. Backend Setup

Build the backend application:

```bash
cd backend
mvn clean package
cd ..
```

#### 3. Docker Setup

Start the entire application stack using Docker Compose:

```bash
docker-compose up --build
```

This will build and start all necessary containers (backend, frontend, database).

## Database Structure (sql) v1.2

![img.png](img.png)
*Database schema diagram*

Link to the interactive dbdiagram:
https://dbdiagram.io/d/time-tracking-website-682b636f1227bdcb4e028d23

### Schema Definition

```sql
-- Enum Tables
CREATE TYPE activity_type AS ENUM (
    'TASK_COMPLETED',
    'COLLABORATOR_JOINED',
    'DEADLINE_UPDATED',
    'PROJECT_CREATED',
    'TASK_CREATED',
    'TASK_UPDATED',
    'COLLABORATOR_INVITED',
    'PROJECT_UPDATED',
    'TASK_DELETED',
    'TIME_LOG_LINKED',
    'INVITATION_REVOKED',
    'ROLE_CHANGED',
    'USER_REMOVED'
);

CREATE TYPE audit_action AS ENUM (
    'ROLE_CHANGED',
    'USER_REMOVED',
    'USER_INVITED',
    'USER_JOINED',
    'USER_LEFT',
    'USER_REJECTED_INVITATION',
    'INVITATION_REVOKED'
);

CREATE TYPE invitation_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);

CREATE TYPE role AS ENUM (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'USER'
);

CREATE TYPE task_status AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'REOPENED'
);

CREATE TYPE task_action AS ENUM (
    'CREATED',
    'UPDATED',
    'ASSIGNED',
    'COMPLETED',
    'STATUS_CHANGED',
    'REOPENED',
    'DELETED'
);

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role role NOT NULL,
    tagline VARCHAR(100),
    bio VARCHAR(1500),
    location VARCHAR(50),
    timezone VARCHAR(50),
    gender VARCHAR(20),
    photo_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces Table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Users Table
CREATE TABLE workspace_users (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    role role NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Invitations Table
CREATE TABLE workspace_invitations (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    invited_user_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    role role NOT NULL,
    status invitation_status NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    action audit_action NOT NULL,
    performed_by UUID REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    project_id UUID REFERENCES projects(id),
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    client_id UUID REFERENCES clients(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    deadline TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project Users Table
CREATE TABLE project_users (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    role role NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project Invitations Table
CREATE TABLE project_invitations (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    invited_user_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    role role NOT NULL,
    status invitation_status NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(150) NOT NULL,
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_by_user_id UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    description VARCHAR(500),
    status task_status NOT NULL DEFAULT 'PENDING',
    deadline TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id)
);

-- Task Assignments Table
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Task Logs Table
CREATE TABLE task_logs (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id),
    user_id UUID REFERENCES users(id),
    action task_action NOT NULL,
    details VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Time Logs Table
CREATE TABLE time_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    last_heartbeat TIMESTAMP,
    minutes INTEGER,
    description VARCHAR(500) NOT NULL DEFAULT '',
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activities Table
CREATE TABLE activities (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type activity_type NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    content VARCHAR(1000) NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

