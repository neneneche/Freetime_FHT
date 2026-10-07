package com.freetime.controller;

import com.freetime.service.UserPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final UserPreferenceService preferenceService;

    public PreferenceController(UserPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<?> getPreferences(Authentication auth) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(preferenceService.getPreferences(userId));
    }

    @PostMapping
    public ResponseEntity<?> setPreference(Authentication auth, @RequestBody Map<String, String> body) {
        try {
            Long userId = (Long) auth.getDetails();
            preferenceService.setPreference(userId, body.get("category"), body.get("preference"));
            return ResponseEntity.ok(Map.of("message", "Gespeichert"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/survey")
    public ResponseEntity<?> saveSurvey(Authentication auth, @RequestBody Map<String, List<String>> body) {
        try {
            Long userId = (Long) auth.getDetails();
            preferenceService.saveSurvey(userId, body.getOrDefault("likes", List.of()), body.getOrDefault("dislikes", List.of()));
            return ResponseEntity.ok(Map.of("message", "Umfrage gespeichert"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}