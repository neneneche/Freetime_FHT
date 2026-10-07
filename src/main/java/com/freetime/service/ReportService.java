package com.freetime.service;

import com.freetime.model.Block;
import com.freetime.model.Report;
import com.freetime.model.User;
import com.freetime.repository.BlockRepository;
import com.freetime.repository.ReportRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository,
                         BlockRepository blockRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Map<String, Object> createReport(Long reporterId, String targetType, Long targetId, String reason) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        Report report = new Report();
        report.setReporter(reporter);
        report.setTargetType(targetType);
        report.setTargetId(targetId);
        report.setReason(reason);
        report = reportRepository.save(report);

        final String typeStr = targetType;
        final String reasonStr = reason;
        final Long reportId = report.getId();
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.freetime.model.enums.UserRole.ADMIN)
                .forEach(admin -> notificationService.notify(admin, "NEW_REPORT",
                        "Neue Meldung: " + typeStr + " (" + reasonStr + ")", reportId));

        Map<String, Object> m = new HashMap<>();
        m.put("id", report.getId());
        m.put("targetType", report.getTargetType());
        m.put("targetId", report.getTargetId());
        m.put("reason", report.getReason());
        m.put("status", report.getStatus());
        return m;
    }

    public void blockUser(Long blockerId, Long blockedId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new RuntimeException("Zu blockierender Nutzer nicht gefunden"));

        if (blockerId.equals(blockedId)) throw new RuntimeException("Eigene Blockierung nicht möglich");

        if (blockRepository.existsByBlockerAndBlocked(blocker, blocked)) {
            throw new RuntimeException("Bereits blockiert");
        }

        Block block = new Block();
        block.setBlocker(blocker);
        block.setBlocked(blocked);
        blockRepository.save(block);
    }

    public void unblockUser(Long blockerId, Long blockedId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new RuntimeException("Nutzer nicht gefunden"));

        Block block = blockRepository.findByBlockerAndBlocked(blocker, blocked)
                .orElseThrow(() -> new RuntimeException("Nicht blockiert"));
        blockRepository.delete(block);
    }

    public List<Map<String, Object>> getReports() {
        return reportRepository.findByStatus("PENDING").stream()
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
                .toList();
    }
}