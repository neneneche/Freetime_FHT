package com.freetime.service;

import com.freetime.dto.UpdateProfileRequest;
import com.freetime.model.User;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
    }

    public Map<String, Object> getUserProfile(Long userId) {
        User user = getUserById(userId);
        return toProfileMap(user);
    }

    public Map<String, Object> updateProfile(Long userId, UpdateProfileRequest req) {
        User user = getUserById(userId);

        if (req.getDisplayName() != null) user.setDisplayName(req.getDisplayName());
        if (req.getCity() != null) user.setCity(req.getCity());
        if (req.getProfilePictureUrl() != null) user.setProfilePictureUrl(req.getProfilePictureUrl());
        if (req.getInterests() != null) user.setInterests(req.getInterests());

        user = userRepository.save(user);
        return toProfileMap(user);
    }

    private Map<String, Object> toProfileMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("displayName", user.getDisplayName());
        map.put("city", user.getCity());
        map.put("birthdate", user.getBirthdate().toString());
        map.put("profilePictureUrl", user.getProfilePictureUrl());
        map.put("interests", user.getInterests());
        map.put("role", user.getRole().name());
        return map;
    }
}