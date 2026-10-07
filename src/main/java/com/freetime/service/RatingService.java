package com.freetime.service;

import com.freetime.model.Event;
import com.freetime.model.Rating;
import com.freetime.model.User;
import com.freetime.model.enums.RatingValue;
import com.freetime.repository.EventRepository;
import com.freetime.repository.RatingRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public RatingService(RatingRepository ratingRepository,
                         UserRepository userRepository,
                         EventRepository eventRepository) {
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    public Map<String, Object> rateEvent(Long userId, Long eventId, String valueStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        RatingValue value = RatingValue.valueOf(valueStr.toUpperCase());

        Optional<Rating> existing = ratingRepository.findByUserAndEvent(user, event);
        if (existing.isPresent()) {
            throw new RuntimeException("Bewertung existiert bereits. Nutze PUT zum Ändern.");
        }

        Rating rating = new Rating();
        rating.setUser(user);
        rating.setEvent(event);
        rating.setValue(value);
        rating = ratingRepository.save(rating);

        return toRatingMap(rating);
    }

    public Map<String, Object> changeRating(Long userId, Long eventId, String newValue) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        Rating rating = ratingRepository.findByUserAndEvent(user, event)
                .orElseThrow(() -> new RuntimeException("Keine Bewertung vorhanden"));

        rating.setValue(RatingValue.valueOf(newValue.toUpperCase()));
        rating = ratingRepository.save(rating);
        return toRatingMap(rating);
    }

    public void removeRating(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        Rating rating = ratingRepository.findByUserAndEvent(user, event)
                .orElseThrow(() -> new RuntimeException("Keine Bewertung vorhanden"));
        ratingRepository.delete(rating);
    }

    public Map<String, Object> getMyRating(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        return ratingRepository.findByUserAndEvent(user, event)
                .map(this::toRatingMap)
                .orElse(null);
    }

    private Map<String, Object> toRatingMap(Rating r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("userId", r.getUser().getId());
        m.put("eventId", r.getEvent().getId());
        m.put("value", r.getValue().name());
        return m;
    }
}