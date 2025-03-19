package com.timestr.backend.dto;

import com.timestr.backend.model.InvitationStatus;
import com.timestr.backend.model.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectInvitationResponse(
        UUID id,
        String invitedUserEmail,
        String invitedUserName,
        Role role,
        InvitationStatus status,
        LocalDateTime createdAt,
        String senderEmail
) {}