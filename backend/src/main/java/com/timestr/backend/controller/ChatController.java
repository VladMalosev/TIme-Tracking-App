package com.timestr.backend.controller;

import com.timestr.backend.model.ChatMessage;
import com.timestr.backend.model.User;
import com.timestr.backend.repository.ChatMessageRepository;
import com.timestr.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Controller
@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chat", description = "Endpoints for managing chat messages and retrieving chat history")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatController(SimpMessagingTemplate simpMessagingTemplate,
                          ChatMessageRepository chatMessageRepository,
                          UserRepository userRepository) {
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/private-message")
    public void sendPrivateMessage(@Payload ChatMessage message) {
        try {
            if (message.getSender() == null || message.getRecipientEmail() == null || message.getContent() == null) {
                throw new IllegalArgumentException("Invalid message: sender, recipientEmail, or content is missing");
            }

            User sender = userRepository.findByEmail(message.getSender().getEmail())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
            User recipient = userRepository.findByEmail(message.getRecipientEmail())
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));

            message.setSender(sender);
            message.setRecipientEmail(recipient.getEmail());
            chatMessageRepository.save(message);

            //for debugging purposes
            logger.info("Saving and sending message: {} from {} to {}",
                    message.getContent(), message.getSender().getEmail(), message.getRecipientEmail());

            simpMessagingTemplate.convertAndSendToUser(
                    message.getRecipientEmail(), "/queue/message", message);
        } catch (Exception e) {
            logger.error("Error sending private message", e);
            throw e;
        }
    }

    @Operation(summary = "Get chat messages", description = "Retrieves chat messages between two users.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @RequestParam String senderEmail,
            @RequestParam String recipientEmail) {
        try {

            List<ChatMessage> messages = chatMessageRepository.findBySenderEmailAndRecipientEmailOrRecipientEmailAndSenderEmail(senderEmail, recipientEmail, senderEmail, recipientEmail);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            logger.error("Error fetching messages", e);
            throw e;
        }
    }

    @Operation(summary = "Get previous chat partners", description = "Retrieves a list of users with whom the current user has previously chatted.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chat partners retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/previous-chat-partners")
    public ResponseEntity<List<String>> getPreviousChatMessages(@RequestParam String userEmail) {
        try {
            List<String> chatPartners = chatMessageRepository.findDistinctChatPartnersByUserEmail(userEmail);

            return ResponseEntity.ok(chatPartners);
        } catch (Exception e) {
            logger.error("Error fetching messages", e);
            throw e;
        }
    }


}