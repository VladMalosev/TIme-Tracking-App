package com.timestr.backend.utils;

import com.timestr.backend.model.WorkspaceRole;

public class RoleUtils {

    public static boolean canAssignRole(WorkspaceRole currentRole, WorkspaceRole newRole) {
        switch (currentRole) {
            case OWNER:
                return true;
            case ADMIN:
                return newRole == WorkspaceRole.MANAGER || newRole == WorkspaceRole.USER;
            case MANAGER:
                return newRole == WorkspaceRole.USER;
            default:
                return false;
        }
    }

    public static boolean canRemoveCollaborator(WorkspaceRole currentRole, WorkspaceRole removedUserRole) {
        switch (currentRole) {
            case OWNER:
                return true;
            case ADMIN:
                return removedUserRole == WorkspaceRole.MANAGER || removedUserRole == WorkspaceRole.USER;
            case MANAGER:
                return removedUserRole == WorkspaceRole.USER;
            default:
                return false;
        }
    }
}