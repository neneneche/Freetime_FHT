package com.freetime.controller;

import com.freetime.dto.RatingRequest;
import com.freetime.service.RatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping("/{eventId}")
    public ResponseEntity<?> rateEvent(Authentication auth, @PathVariable Long eventId, @RequestBody RatingRequest req) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(ratingService.rateEvent(userId, eventId, req.getValue()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<?> changeRating(Authentication auth, @PathVariable Long eventId, @RequestBody RatingRequest req) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(ratingService.changeRating(userId, eventId, req.getValue()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> removeRating(Authentication auth, @PathVariable Long eventId) {
        try {
            Long userId = (Long) auth.getDetails();
            ratingService.removeRating(userId, eventId);
            return ResponseEntity.ok(Map.of("message", "Bewertung entfernt"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<?> getMyRating(Authentication auth, @PathVariable Long eventId) {
        Long userId = (Long) auth.getDetails();
        Map<String, Object> rating = ratingService.getMyRating(userId, eventId);
        if (rating == null) return ResponseEntity.ok(Map.of("rating", "NONE"));
        return ResponseEntity.ok(rating);
    }
}