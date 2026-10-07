package com.freetime.service;

import com.freetime.model.Event;
import com.freetime.model.Rating;
import com.freetime.model.User;
import com.freetime.model.enums.EventSource;
import com.freetime.model.enums.EventState;
import com.freetime.model.enums.RatingValue;
import com.freetime.repository.EventRepository;
import com.freetime.repository.RatingRepository;
import com.freetime.repository.UserRepository;
import com.freetime.repository.UserPreferenceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final double A_PROFILE_INTEREST = 1.0;
    private static final double B_RATING_HISTORY = 2.0;
    private static final double C_PROXIMITY = 0.5;
    private static final double D_FRIEND_LIKES = 0.3;
    private static final double E_TIME_PROXIMITY = 0.2;

    private final EventRepository eventRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;

    public RecommendationService(EventRepository eventRepository,
                                  RatingRepository ratingRepository,
                                  UserRepository userRepository,
                                  UserPreferenceRepository preferenceRepository) {
        this.eventRepository = eventRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
    }

    public List<Map<String, Object>> getRecommendations(Long userId, Double userLat, Double userLng, Double radiusKm) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        // Get visible events
        List<Event> candidates = eventRepository.findByStateOrSource(EventState.FREIGEGEBEN, EventSource.STADTWIEN);
        LocalDateTime now = LocalDateTime.now();

        candidates = candidates.stream()
                .filter(e -> e.getStartTime().isAfter(now) && e.getStartTime().isBefore(now.plusDays(30)))
                .collect(Collectors.toList());

        if (userLat != null && userLng != null) {
            double radius = radiusKm != null ? radiusKm : 50.0;
            candidates = candidates.stream()
                    .filter(e -> EventService.haversineKm(userLat, userLng, e.getLatitude(), e.getLongitude()) <= radius)
                    .collect(Collectors.toList());
        }

        // Get user's ratings
        List<Rating> userRatings = ratingRepository.findByUser(user);
        Set<Long> ratedEventIds = userRatings.stream().map(r -> r.getEvent().getId()).collect(Collectors.toSet());
        Set<Long> dislikedIds = userRatings.stream()
                .filter(r -> r.getValue() == RatingValue.DISLIKE)
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        // Exclude already rated events
        candidates = candidates.stream()
                .filter(e -> !ratedEventIds.contains(e.getId()))
                .collect(Collectors.toList());

        // Calculate category weights from history
        Map<String, double[]> catStats = new HashMap<>(); // [likes, dislikes]
        for (Rating r : userRatings) {
            String cat = r.getEvent().getCategory();
            catStats.computeIfAbsent(cat, k -> new double[]{0, 0});
            if (r.getValue() == RatingValue.LIKE) catStats.get(cat)[0]++;
            else catStats.get(cat)[1]++;
        }

        Set<String> profileInterests = user.getInterests();
        Set<String> likedCategories = new HashSet<>();
        Set<String> dislikedCategories = new HashSet<>();
        preferenceRepository.findByUser(user).forEach(p -> {
            if ("LIKE".equals(p.getPreference())) likedCategories.add(p.getCategory());
            else dislikedCategories.add(p.getCategory());
        });

        // Score each candidate
        List<Map<String, Object>> scored = new ArrayList<>();
        for (Event e : candidates) {
            double score = 0;

            // Profile interest bonus
            if (profileInterests != null && profileInterests.contains(e.getCategory())) {
                score += A_PROFILE_INTEREST;
            }

            // User preference bonus
            if (likedCategories.contains(e.getCategory())) {
                score += 0.5;
            }
            if (dislikedCategories.contains(e.getCategory())) {
                score -= 1.5;
            }

            // Rating history weight
            double[] stats = catStats.getOrDefault(e.getCategory(), new double[]{0, 0});
            double catWeight = B_RATING_HISTORY * (stats[0] - stats[1]) / (stats[0] + stats[1] + 1);
            score += catWeight;

            // Proximity bonus
            if (userLat != null && userLng != null) {
                double dist = EventService.haversineKm(userLat, userLng, e.getLatitude(), e.getLongitude());
                double radius = radiusKm != null ? radiusKm : 50.0;
                score += C_PROXIMITY * (1 - dist / radius);
            }

            // Time proximity bonus
            long daysUntil = ChronoUnit.DAYS.between(now, e.getStartTime());
            score += E_TIME_PROXIMITY * (1.0 - (double) daysUntil / 30.0);

            Map<String, Object> eventMap = toRecommendationMap(e);
            eventMap.put("score", score);
            scored.add(eventMap);
        }

        // Sort by score descending, pick top 20
        scored.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
        return scored.stream().limit(20).collect(Collectors.toList());
    }

    private Map<String, Object> toRecommendationMap(Event e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.getId());
        m.put("title", e.getTitle());
        m.put("description", e.getDescription());
        m.put("category", e.getCategory());
        m.put("startTime", e.getStartTime().toString());
        m.put("endTime", e.getEndTime().toString());
        m.put("address", e.getAddress());
        m.put("latitude", e.getLatitude());
        m.put("longitude", e.getLongitude());
        m.put("source", e.getSource().name());
        if (e.getCreator() != null) {
            m.put("creatorId", e.getCreator().getId());
        }
        return m;
    }
}