package com.timestr.backend.repository;

import com.timestr.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findBySenderEmailAndRecipientEmailOrRecipientEmailAndSenderEmail(
            String senderEmail, String recipientEmail, String senderEmail2, String recipientEmail2
    );
    @Query("SELECT DISTINCT CASE WHEN c.sender.email = :userEmail THEN c.recipientEmail ELSE c.sender.email END " +
            "FROM ChatMessage c " +
            "WHERE c.sender.email = :userEmail OR c.recipientEmail = :userEmail")
    List<String> findDistinctChatPartnersByUserEmail(@Param("userEmail") String userEmail);
}