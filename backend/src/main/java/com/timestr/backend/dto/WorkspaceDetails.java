package com.timestr.backend.dto;


import com.timestr.backend.model.Project;
import com.timestr.backend.model.Workspace;
import com.timestr.backend.model.WorkspaceUser;

import java.util.List;

public class WorkspaceDetails {
    private Workspace workspace;
    private List<WorkspaceUser> users;
    private List<Project> projects;

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public void setUsers(List<WorkspaceUser> users) {
        this.users = users;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public List<WorkspaceUser> getUsers() {
        return users;
    }

    public List<Project> getProjects() {
        return projects;
    }
}
