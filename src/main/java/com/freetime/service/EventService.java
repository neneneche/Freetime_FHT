package com.freetime.service;

import com.freetime.dto.CreateEventRequest;
import com.freetime.model.Event;
import com.freetime.model.User;
import com.freetime.model.enums.EventSource;
import com.freetime.model.enums.EventState;
import com.freetime.repository.EventRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final GeocodingService geocodingService;
    private final NotificationService notificationService;

    public EventService(EventRepository eventRepository, UserRepository userRepository,
                         GeocodingService geocodingService, NotificationService notificationService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.geocodingService = geocodingService;
        this.notificationService = notificationService;
    }

    public Event createEvent(Long userId, CreateEventRequest req) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        long activeCount = eventRepository.countByCreatorAndStateNot(creator, EventState.ABGELEHNT);
        if (activeCount >= 5) {
            throw new RuntimeException("Maximal 5 aktive Veranstaltungen erlaubt");
        }

        LocalDateTime start = LocalDateTime.parse(req.getStartTime());
        LocalDateTime end = LocalDateTime.parse(req.getEndTime());

        if (start.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Startzeitpunkt darf nicht in der Vergangenheit liegen");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("Endzeitpunkt muss nach Startzeitpunkt liegen");
        }

        Event event = new Event();
        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setCategory(req.getCategory());
        event.setStartTime(start);
        event.setEndTime(end);
        event.setAddress(req.getAddress());
        event.setSource(EventSource.NUTZER);
        event.setState(EventState.EINGEREICHT);
        event.setCreator(creator);

        double[] coords = geocodingService.geocode(req.getAddress());
        event.setLatitude(coords[0]);
        event.setLongitude(coords[1]);

        return eventRepository.save(event);
    }

    public List<Map<String, Object>> getVisibleEvents(Double lat, Double lng, Double radiusKm,
                                                       String category, String source, String search) {
        List<Event> candidates = eventRepository.findByStateOrSource(EventState.FREIGEGEBEN, EventSource.STADTWIEN);

        LocalDateTime now = LocalDateTime.now();
        double radius = radiusKm != null ? radiusKm : 50.0;

        return candidates.stream()
                .filter(e -> e.getStartTime().isAfter(now) && e.getStartTime().isBefore(now.plusDays(30)))
                .filter(e -> {
                    if (lat == null || lng == null) return true;
                    return haversineKm(lat, lng, e.getLatitude(), e.getLongitude()) <= radius;
                })
                .filter(e -> {
                    if (category == null || category.isBlank()) return true;
                    return e.getCategory().equalsIgnoreCase(category);
                })
                .filter(e -> {
                    if (source == null || source.isBlank()) return true;
                    return e.getSource().name().equalsIgnoreCase(source);
                })
                .filter(e -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return e.getTitle().toLowerCase().contains(q)
                            || (e.getDescription() != null && e.getDescription().toLowerCase().contains(q))
                            || e.getAddress().toLowerCase().contains(q);
                })
                .sorted(Comparator.comparing(Event::getStartTime))
                .map(this::toEventMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getEventDetail(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));
        return toEventMap(event);
    }

    public Map<String, Object> updateEvent(Long userId, Long eventId, CreateEventRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        if (!event.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Nur der Ersteller darf ändern");
        }
        if (event.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Veranstaltung hat bereits begonnen");
        }

        if (req.getTitle() != null) event.setTitle(req.getTitle());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getStartTime() != null) event.setStartTime(LocalDateTime.parse(req.getStartTime()));
        if (req.getEndTime() != null) event.setEndTime(LocalDateTime.parse(req.getEndTime()));
        if (req.getAddress() != null) event.setAddress(req.getAddress());

        // Re-submit for moderation if title, description, or address changed
        event.setState(EventState.EINGEREICHT);

        event = eventRepository.save(event);
        return toEventMap(event);
    }

    public void cancelEvent(Long userId, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));
        if (!event.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Nur der Ersteller darf absagen");
        }
        event.setState(EventState.ABGELEHNT);
        event.setRejectionReason("Vom Ersteller abgesagt");
        eventRepository.save(event);
    }

    public List<Map<String, Object>> getMyEvents(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return eventRepository.findByCreator(user).stream()
                .map(this::toEventMap)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingEvents() {
        return eventRepository.findByState(EventState.EINGEREICHT).stream()
                .map(this::toEventMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> approveEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));
        event.setState(EventState.FREIGEGEBEN);
        event = eventRepository.save(event);
        if (event.getCreator() != null) {
            notificationService.notify(event.getCreator(), "EVENT_APPROVED",
                    "Dein Event \"" + event.getTitle() + "\" wurde freigegeben!", event.getId());
        }
        return toEventMap(event);
    }

    public Map<String, Object> rejectEvent(Long eventId, String reason) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));
        event.setState(EventState.ABGELEHNT);
        event.setRejectionReason(reason);
        event = eventRepository.save(event);
        if (event.getCreator() != null) {
            notificationService.notify(event.getCreator(), "EVENT_REJECTED",
                    "Dein Event \"" + event.getTitle() + "\" wurde abgelehnt: " + reason, event.getId());
        }
        return toEventMap(event);
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public Map<String, Object> toEventMap(Event e) {
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
        m.put("state", e.getState().name());
        m.put("rejectionReason", e.getRejectionReason());
        if (e.getCreator() != null) {
            m.put("creatorId", e.getCreator().getId());
            m.put("creatorUsername", e.getCreator().getUsername());
        }
        return m;
    }
}