package com.timestr.backend.repository;

import com.timestr.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findBySenderEmailAndRecipientEmailOrRecipientEmailAndSenderEmail(
            String senderEmail, String recipientEmail, String senderEmail2, String recipientEmail2
    );
}