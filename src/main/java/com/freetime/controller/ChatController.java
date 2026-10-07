package com.freetime.controller;

import com.freetime.dto.SendMessageRequest;
import com.freetime.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(chatService.getConversations(userId));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getMessages(Authentication auth, @PathVariable String chatId) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(chatService.getMessages(userId, chatId));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<?> sendMessage(Authentication auth, @PathVariable String chatId, @RequestBody SendMessageRequest req) {
        try {
            Long userId = (Long) auth.getDetails();

            if (chatId.startsWith("event-")) {
                Long eventId = Long.parseLong(chatId.substring(6));
                return ResponseEntity.ok(chatService.sendGroupMessage(userId, eventId, req.getText()));
            } else if (chatId.startsWith("dm-")) {
                // Parse DM chatId: dm-{min}-{max}
                String[] parts = chatId.split("-");
                Long id1 = Long.parseLong(parts[1]);
                Long id2 = Long.parseLong(parts[2]);
                Long recipientId = id1.equals(userId) ? id2 : id1;
                return ResponseEntity.ok(chatService.sendDirectMessage(userId, recipientId, req.getText()));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Ungültige Chat-ID"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/dm/{userId}")
    public ResponseEntity<?> startDm(Authentication auth, @PathVariable Long userId, @RequestBody SendMessageRequest req) {
        try {
            Long senderId = (Long) auth.getDetails();
            return ResponseEntity.ok(chatService.sendDirectMessage(senderId, userId, req.getText()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}