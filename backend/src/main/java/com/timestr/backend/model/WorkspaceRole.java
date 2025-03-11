package com.timestr.backend.model;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Set;
import java.util.stream.Collectors;

public enum WorkspaceRole {
    OWNER(Set.of(
            "WORKSPACE_UPDATE",
            "WORKSPACE_DELETE",
            "WORKSPACE_ADD_USER",
            "WORKSPACE_REMOVE_USER",
            "WORKSPACE_ASSIGN_ROLE",
            "PROJECT_CREATE",
            "PROJECT_UPDATE",
            "PROJECT_DELETE",
            "TASK_CREATE",
            "TASK_UPDATE",
            "TASK_DELETE",
            "TIME_LOG_CREATE",
            "TIME_LOG_UPDATE",
            "TIME_LOG_DELETE",
            "TIME_LOG_VIEW_ALL",
            "REPORT_GENERATE"
    )),
    ADMIN(Set.of(
            "WORKSPACE_UPDATE",
            "WORKSPACE_ADD_USER",
            "WORKSPACE_REMOVE_USER",
            "WORKSPACE_ASSIGN_ROLE",
            "PROJECT_CREATE",
            "PROJECT_UPDATE",
            "PROJECT_DELETE",
            "TASK_CREATE",
            "TASK_UPDATE",
            "TASK_DELETE",
            "TIME_LOG_CREATE",
            "TIME_LOG_UPDATE",
            "TIME_LOG_DELETE",
            "TIME_LOG_VIEW_ALL",
            "REPORT_GENERATE"
    )),
    MANAGER(Set.of(
            "PROJECT_CREATE",
            "PROJECT_UPDATE",
            "PROJECT_DELETE",
            "TASK_CREATE",
            "TASK_UPDATE",
            "TASK_DELETE",
            "TIME_LOG_CREATE",
            "TIME_LOG_UPDATE",
            "TIME_LOG_DELETE",
            "TIME_LOG_VIEW_ALL",
            "REPORT_GENERATE"
    )),
    USER(Set.of(
            "PROJECT_VIEW",
            "TASK_VIEW",
            "TIME_LOG_CREATE"
    ));

    private final Set<String> permissions;

    WorkspaceRole(Set<String> permissions) {
        this.permissions = permissions;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }


}