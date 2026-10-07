package com.freetime.controller;

import com.freetime.service.FriendshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public ResponseEntity<?> getFriends(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(friendshipService.getFriends(userId));
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getPendingRequests(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(friendshipService.getPendingRequests(userId));
    }

    @PostMapping("/request/{userId}")
    public ResponseEntity<?> sendRequest(Authentication auth, @PathVariable Long userId) {
        try {
            Long requesterId = (Long) auth.getDetails();
            return ResponseEntity.ok(friendshipService.sendRequest(requesterId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<?> acceptRequest(Authentication auth, @PathVariable Long friendshipId) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(friendshipService.acceptRequest(userId, friendshipId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/decline/{friendshipId}")
    public ResponseEntity<?> declineRequest(Authentication auth, @PathVariable Long friendshipId) {
        try {
            Long userId = (Long) auth.getDetails();
            friendshipService.declineRequest(userId, friendshipId);
            return ResponseEntity.ok(Map.of("message", "Anfrage abgelehnt"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<?> removeFriend(Authentication auth, @PathVariable Long friendshipId) {
        try {
            Long userId = (Long) auth.getDetails();
            friendshipService.removeFriend(userId, friendshipId);
            return ResponseEntity.ok(Map.of("message", "Freundschaft aufgelöst"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}