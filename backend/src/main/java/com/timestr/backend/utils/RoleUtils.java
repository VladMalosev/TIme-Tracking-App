package com.timestr.backend.utils;

import com.timestr.backend.model.Role;

public class RoleUtils {

    public static boolean canAssignRole(Role currentRole, Role newRole) {
        switch (currentRole) {
            case OWNER:
                return true;
            case ADMIN:
                return newRole == Role.MANAGER || newRole == Role.USER;
            case MANAGER:
                return newRole == Role.USER;
            default:
                return false;
        }
    }

    public static boolean canRemoveCollaborator(Role currentRole, Role removedUserRole) {
        switch (currentRole) {
            case OWNER:
                return true;
            case ADMIN:
                return removedUserRole == Role.MANAGER || removedUserRole == Role.USER;
            case MANAGER:
                return removedUserRole == Role.USER;
            default:
                return false;
        }
    }
}