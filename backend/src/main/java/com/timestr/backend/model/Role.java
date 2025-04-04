package com.timestr.backend.model;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.Set;

public enum Role {
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
    ), 4),
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
    ), 3),
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
    ), 2),
    USER(Set.of(
            "PROJECT_VIEW",
            "TASK_VIEW",
            "TIME_LOG_CREATE"
    ), 1);

    private final Set<String> permissions;
    private final int hierarchy;

    Role(Set<String> permissions, int hierarchy) {
        this.permissions = permissions;
        this.hierarchy = hierarchy;
    }

    public Set<String> getPermissions() {
        return Collections.unmodifiableSet(permissions);
    }

    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }

    public Set<SimpleGrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + this.name()));
    }

    public int getHierarchy() {
        return hierarchy;
    }

    public boolean isHigherThan(Role other) {
        return this.hierarchy > other.hierarchy;
    }

    public boolean isAtLeast(Role other) {
        return this.hierarchy >= other.hierarchy;
    }

    public String getDisplayName() {
        return this.name().charAt(0) + this.name().substring(1).toLowerCase();
    }
}