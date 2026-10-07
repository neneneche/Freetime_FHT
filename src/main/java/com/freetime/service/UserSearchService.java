package com.freetime.service;

import com.freetime.model.User;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserSearchService {

    private final UserRepository userRepository;

    public UserSearchService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> searchUsers(String query, Long currentUserId) {
        String q = query.toLowerCase().trim();
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> u.getUsername().toLowerCase().contains(q)
                        || u.getDisplayName().toLowerCase().contains(q))
                .limit(10)
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("displayName", u.getDisplayName());
                    m.put("city", u.getCity());
                    m.put("profilePictureUrl", u.getProfilePictureUrl());
                    m.put("role", u.getRole().name());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllUsers(Long currentUserId) {
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("displayName", u.getDisplayName());
                    m.put("city", u.getCity());
                    m.put("profilePictureUrl", u.getProfilePictureUrl());
                    m.put("role", u.getRole().name());
                    return m;
                })
                .collect(Collectors.toList());
    }
}