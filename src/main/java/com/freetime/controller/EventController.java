package com.freetime.controller;

import com.freetime.dto.CreateEventRequest;
import com.freetime.dto.RejectRequest;
import com.freetime.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<?> getEvents(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(eventService.getVisibleEvents(lat, lng, radius, category, source, q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventService.getEventDetail(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEvent(Authentication auth, @RequestBody CreateEventRequest req) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(eventService.toEventMap(eventService.createEvent(userId, req)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(Authentication auth, @PathVariable Long id, @RequestBody CreateEventRequest req) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(eventService.updateEvent(userId, id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelEvent(Authentication auth, @PathVariable Long id) {
        try {
            Long userId = (Long) auth.getDetails();
            eventService.cancelEvent(userId, id);
            return ResponseEntity.ok(Map.of("message", "Veranstaltung abgesagt"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyEvents(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(eventService.getMyEvents(userId));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingEvents() {
        return ResponseEntity.ok(eventService.getPendingEvents());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveEvent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventService.approveEvent(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectEvent(@PathVariable Long id, @RequestBody(required = false) RejectRequest req) {
        try {
            String reason = req != null ? req.getReason() : "Abgelehnt";
            return ResponseEntity.ok(eventService.rejectEvent(id, reason));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}