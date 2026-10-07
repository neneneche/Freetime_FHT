package com.freetime.controller;

import com.freetime.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final RecommendationService recommendationService;

    public DashboardController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(
            Authentication auth,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius) {
        Long userId = (Long) auth.getDetails();
        return ResponseEntity.ok(recommendationService.getRecommendations(userId, lat, lng, radius));
    }
}