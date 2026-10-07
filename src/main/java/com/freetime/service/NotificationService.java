package com.freetime.service;

import com.freetime.model.Notification;
import com.freetime.model.User;
import com.freetime.repository.NotificationRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                                UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void notify(User user, String type, String message, Long relatedId) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setRelatedId(relatedId);
        notificationRepository.save(n);
    }

    public List<Map<String, Object>> getNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(n -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", n.getId());
                    m.put("type", n.getType());
                    m.put("message", n.getMessage());
                    m.put("read", n.isRead());
                    m.put("createdAt", n.getCreatedAt().toString());
                    m.put("relatedId", n.getRelatedId());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return notificationRepository.countByUserAndReadFalse(user);
    }

    public void markAllRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        notificationRepository.findByUserAndReadFalse(user).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markRead(Long userId, Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }
}