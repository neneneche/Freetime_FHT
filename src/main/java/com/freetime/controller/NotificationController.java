package com.freetime.controller;

import com.freetime.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("message", "Gelesen"));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getDetails();
        notificationService.markRead(userId, id);
        return ResponseEntity.ok(Map.of("message", "Gelesen"));
    }
}