package com.freetime.controller;

import com.freetime.model.*;
import com.freetime.model.enums.*;
import com.freetime.repository.*;
import com.freetime.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public AdminController(UserRepository userRepository,
                           EventRepository eventRepository,
                           ReportRepository reportRepository,
                           PasswordEncoder passwordEncoder,
                           NotificationService notificationService) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.reportRepository = reportRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    // === Report Management ===
    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(Authentication auth, @PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        Long adminId = (Long) auth.getDetails();
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meldung nicht gefunden"));

        String action = body.getOrDefault("action", "DISMISSED");
        String response = body.getOrDefault("response", "");

        report.setStatus(action); // RESOLVED, DISMISSED
        reportRepository.save(report);

        // Notify reporter
        notificationService.notify(report.getReporter(), "REPORT_RESOLVED",
                "Deine Meldung wurde bearbeitet: " + (response.isEmpty() ? action : response), report.getId());

        return ResponseEntity.ok(Map.of("message", "Meldung bearbeitet"));
    }

    @PostMapping("/reports/{id}/respond")
    public ResponseEntity<?> respondToReport(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meldung nicht gefunden"));

        String response = body.getOrDefault("response", "");
        report.setStatus("RESPONDED");
        reportRepository.save(report);

        notificationService.notify(report.getReporter(), "REPORT_RESPONSE",
                "Antwort auf deine Meldung: " + response, report.getId());

        return ResponseEntity.ok(Map.of("message", "Antwort gesendet"));
    }

    // === Event Management (Admin can edit/delete any) ===
    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(Authentication auth, @PathVariable Long id,
                                         @RequestBody(required = false) Map<String, String> body) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event nicht gefunden"));

        String reason = body != null ? body.getOrDefault("reason", "Vom Administrator gelöscht") : "Vom Administrator gelöscht";
        event.setState(EventState.ABGELEHNT);
        event.setRejectionReason(reason);
        eventRepository.save(event);

        if (event.getCreator() != null) {
            notificationService.notify(event.getCreator(), "EVENT_DELETED",
                    "Dein Event \"" + event.getTitle() + "\" wurde vom Administrator entfernt: " + reason, event.getId());
        }

        return ResponseEntity.ok(Map.of("message", "Event gelöscht"));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> editEvent(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event nicht gefunden"));

        if (body.containsKey("title")) event.setTitle(body.get("title"));
        if (body.containsKey("description")) event.setDescription(body.get("description"));
        if (body.containsKey("category")) event.setCategory(body.get("category"));
        if (body.containsKey("address")) event.setAddress(body.get("address"));
        if (body.containsKey("startTime")) event.setStartTime(java.time.LocalDateTime.parse(body.get("startTime")));
        if (body.containsKey("endTime")) event.setEndTime(java.time.LocalDateTime.parse(body.get("endTime")));

        eventRepository.save(event);
        return ResponseEntity.ok(Map.of("message", "Event aktualisiert"));
    }

    @PostMapping("/events/{id}/cancel")
    public ResponseEntity<?> cancelEvent(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event nicht gefunden"));
        event.setState(EventState.ABGELEHNT);
        event.setRejectionReason(body.getOrDefault("reason", "Abgesagt"));
        eventRepository.save(event);

        if (event.getCreator() != null) {
            notificationService.notify(event.getCreator(), "EVENT_CANCELLED",
                    "Dein Event \"" + event.getTitle() + "\" wurde abgesagt.", event.getId());
        }

        return ResponseEntity.ok(Map.of("message", "Event abgesagt"));
    }

    // === User Management ===
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("displayName", u.getDisplayName());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole().name());
                    m.put("verified", u.isVerified());
                    m.put("accountNonLocked", u.isAccountNonLocked());
                    m.put("city", u.getCity());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        String newPassword = body.getOrDefault("password", "Temp123!@#$%");
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        notificationService.notify(user, "PASSWORD_RESET",
                "Dein Passwort wurde von einem Administrator zurückgesetzt.", null);

        return ResponseEntity.ok(Map.of("message", "Passwort zurückgesetzt", "password", newPassword));
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        user.setAccountNonLocked(false);
        userRepository.save(user);

        String reason = body != null ? body.getOrDefault("reason", "Gesperrt") : "Gesperrt";
        notificationService.notify(user, "ACCOUNT_BANNED",
                "Dein Konto wurde gesperrt: " + reason, null);

        return ResponseEntity.ok(Map.of("message", "Benutzer gesperrt"));
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        user.setAccountNonLocked(true);
        userRepository.save(user);

        notificationService.notify(user, "ACCOUNT_UNBANNED",
                "Dein Konto wurde entsperrt.", null);

        return ResponseEntity.ok(Map.of("message", "Benutzer entsperrt"));
    }

    @PostMapping("/users/{id}/change-role")
    public ResponseEntity<?> changeRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        String role = body.getOrDefault("role", "USER");
        user.setRole(UserRole.valueOf(role));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Rolle geändert"));
    }

    // === Get all reports with details ===
    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        List<Map<String, Object>> reports = reportRepository.findAll().stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("reporterId", r.getReporter().getId());
                    m.put("reporterUsername", r.getReporter().getUsername());
                    m.put("targetType", r.getTargetType());
                    m.put("targetId", r.getTargetId());
                    m.put("reason", r.getReason());
                    m.put("status", r.getStatus());
                    m.put("createdAt", r.getCreatedAt().toString());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }
}