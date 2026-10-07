package com.freetime.controller;

import com.freetime.dto.ReportRequest;
import com.freetime.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/reports")
    public ResponseEntity<?> createReport(Authentication auth, @RequestBody ReportRequest req) {
        try {
            Long userId = (Long) auth.getDetails();
            return ResponseEntity.ok(reportService.createReport(userId, req.getTargetType(), req.getTargetId(), req.getReason()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getReports() {
        return ResponseEntity.ok(reportService.getReports());
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(Authentication auth, @PathVariable Long id) {
        try {
            Long userId = (Long) auth.getDetails();
            reportService.blockUser(userId, id);
            return ResponseEntity.ok(Map.of("message", "Nutzer blockiert"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}/block")
    public ResponseEntity<?> unblockUser(Authentication auth, @PathVariable Long id) {
        try {
            Long userId = (Long) auth.getDetails();
            reportService.unblockUser(userId, id);
            return ResponseEntity.ok(Map.of("message", "Nutzer entblockiert"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}