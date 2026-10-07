package com.freetime.service;

import com.freetime.model.User;
import com.freetime.model.UserPreference;
import com.freetime.repository.UserPreferenceRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserPreferenceService {

    private final UserPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public UserPreferenceService(UserPreferenceRepository preferenceRepository,
                                  UserRepository userRepository) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> likes = new ArrayList<>();
        List<Map<String, String>> dislikes = new ArrayList<>();

        for (UserPreference p : preferenceRepository.findByUser(user)) {
            Map<String, String> item = new HashMap<>();
            item.put("category", p.getCategory());
            item.put("preference", p.getPreference());
            if ("LIKE".equals(p.getPreference())) {
                likes.add(item);
            } else {
                dislikes.add(item);
            }
        }

        result.put("likes", likes);
        result.put("dislikes", dislikes);
        return result;
    }

    public void setPreference(Long userId, String category, String preference) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        if (!"LIKE".equals(preference) && !"DISLIKE".equals(preference)) {
            throw new RuntimeException("Ungültige Präferenz");
        }

        Optional<UserPreference> existing = preferenceRepository.findByUserAndCategory(user, category);
        if (existing.isPresent()) {
            UserPreference p = existing.get();
            if (preference.equals(p.getPreference())) {
                // Toggle off (remove preference)
                preferenceRepository.delete(p);
                return;
            }
            p.setPreference(preference);
            preferenceRepository.save(p);
        } else {
            UserPreference p = new UserPreference();
            p.setUser(user);
            p.setCategory(category);
            p.setPreference(preference);
            preferenceRepository.save(p);
        }

        // Also update user.interests for backward compatibility
        Set<String> interests = new HashSet<>(user.getInterests());
        if ("LIKE".equals(preference)) {
            interests.add(category);
        } else {
            interests.remove(category);
        }
        user.setInterests(interests);
        userRepository.save(user);
    }

    public void saveSurvey(Long userId, List<String> likes, List<String> dislikes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        // Clear existing
        preferenceRepository.findByUser(user).forEach(preferenceRepository::delete);

        Set<String> interestSet = new HashSet<>();

        for (String cat : likes) {
            UserPreference p = new UserPreference();
            p.setUser(user);
            p.setCategory(cat);
            p.setPreference("LIKE");
            preferenceRepository.save(p);
            interestSet.add(cat);
        }
        for (String cat : dislikes) {
            UserPreference p = new UserPreference();
            p.setUser(user);
            p.setCategory(cat);
            p.setPreference("DISLIKE");
            preferenceRepository.save(p);
        }

        user.setInterests(interestSet);
        userRepository.save(user);
    }
}