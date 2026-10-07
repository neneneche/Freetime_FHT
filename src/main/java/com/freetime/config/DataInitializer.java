package com.freetime.config;

import com.freetime.model.*;
import com.freetime.model.enums.*;
import com.freetime.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RatingRepository ratingRepository;
    private final FriendshipRepository friendshipRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           EventRepository eventRepository,
                           RatingRepository ratingRepository,
                           FriendshipRepository friendshipRepository,
                           MessageRepository messageRepository,
                           NotificationRepository notificationRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ratingRepository = ratingRepository;
        this.friendshipRepository = friendshipRepository;
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Create users
        User admin = createUser("admin", "admin@freetime.at", "Admin123!@#$%", "Admin User",
                LocalDate.of(1990, 1, 1), "Wien", UserRole.ADMIN, true,
                Set.of("Musik", "Kultur", "Technologie"));

        User moderator = createUser("moderator", "mod@freetime.at", "Mod1234!@#$%", "Moderator Max",
                LocalDate.of(1988, 5, 15), "Wien", UserRole.MODERATOR, true,
                Set.of("Sport", "Natur"));

        User alice = createUser("alice", "alice@example.com", "Alice123!@#$%", "Alice Gruber",
                LocalDate.of(2000, 3, 20), "Wien", UserRole.USER, false,
                Set.of("Musik", "Food", "Party"));

        User bob = createUser("bob", "bob@example.com", "Bob12345!@#$%", "Bob Müller",
                LocalDate.of(1998, 7, 10), "Wien", UserRole.USER, false,
                Set.of("Sport", "Technologie", "Kunst"));

        User carla = createUser("carla", "carla@example.com", "Carla123!@#$%", "Carla Schneider",
                LocalDate.of(2002, 11, 5), "Wien", UserRole.USER, false,
                Set.of("Kultur", "Natur", "Food"));

        // Create events (mix of approved user events and "imported" stadtwien events)
        Event e1 = createEvent("Donauinselfest 2026", "Größtes Open-Air-Festival Europas am Donauufer.",
                "Musik", 14, 16, 48.2330, 16.4070, "Donauinsel, Wien", EventSource.STADTWIEN, EventState.FREIGEGEBEN, null, null);

        Event e2 = createEvent("Kunsthalle Wien – Neue Ausstellung", "Zeitgenössische Kunstausstellung mit internationalen Künstlern.",
                "Kunst", 7, 7, 48.2082, 16.3738, "Museumsplatz 1, Wien", EventSource.STADTWIEN, EventState.FREIGEGEBEN, null, null);

        Event e3 = createEvent("Streetfood Markt am Naschmarkt", "Internationale Gerichte von lokalen und internationalen Köchen.",
                "Food", 3, 3, 48.1990, 16.3610, "Naschmarkt, Wien", EventSource.STADTWIEN, EventState.FREIGEGEBEN, null, null);

        Event e4 = createEvent("Coding Meetup Wien", "Treffen für Entwickler: Talks über Spring Boot und Angular.",
                "Technologie", 10, 10, 48.2082, 16.3738, "TechHub Wien, 1. Bezirk", EventSource.NUTZER, EventState.FREIGEGEBEN, bob, null);

        Event e5 = createEvent("Wandern am Wienerwald", "Gemeinsame Wanderung durch den Wienerwald mit Picknick.",
                "Natur", 5, 5, 48.2300, 16.2700, "Wienerwald, Wien", EventSource.NUTZER, EventState.FREIGEGEBEN, carla, null);

        Event e6 = createEvent("Jazz Night im Porgy & Bess", "Live-Jazz mit lokalen und internationalen Bands.",
                "Musik", 12, 12, 48.2075, 16.3720, "Porgy & Bess, Riemergasse 11, Wien", EventSource.STADTWIEN, EventState.FREIGEGEBEN, null, null);

        Event e7 = createEvent("Yoga im Park", "Freies Yoga-Event im Augarten für alle Levels.",
                "Sport", 8, 8, 48.2230, 16.3850, "Augarten, Wien", EventSource.NUTZER, EventState.FREIGEGEBEN, alice, null);

        Event e8 = createEvent("Game Night Wien", "Brettspiele und Videospiele im Coworking Space.",
                "Technologie", 20, 20, 48.2100, 16.3650, "Seestadt, Wien", EventSource.NUTZER, EventState.EINGEREICHT, bob, null);

        Event e9 = createEvent("Weihnachtsmarkt Schloss Schönbrunn", "Traditioneller Weihnachtsmarkt vor dem Schloss.",
                "Kultur", 25, 25, 48.1855, 16.3120, "Schloss Schönbrunn, Wien", EventSource.STADTWIEN, EventState.FREIGEGEBEN, null, null);

        Event e10 = createEvent("Rave im Prater", "Elektronische Musik im Herzen von Wien.",
                "Party", 15, 15, 48.2150, 16.4040, "Prater, Wien", EventSource.NUTZER, EventState.ABGELEHNT, alice, "Zu laut für die Nachbarschaft");

        // Create friendships
        createFriendship(alice, bob, FriendshipStatus.BESTAETIGT);
        createFriendship(alice, carla, FriendshipStatus.BESTAETIGT);
        createFriendship(bob, carla, FriendshipStatus.ANGEFRAGT);

        // Create ratings (likes)
        createRating(alice, e1, RatingValue.LIKE);
        createRating(alice, e3, RatingValue.LIKE);
        createRating(alice, e6, RatingValue.LIKE);
        createRating(bob, e1, RatingValue.LIKE);
        createRating(bob, e4, RatingValue.LIKE);
        createRating(bob, e5, RatingValue.DISLIKE);
        createRating(carla, e2, RatingValue.LIKE);
        createRating(carla, e5, RatingValue.LIKE);
        createRating(carla, e7, RatingValue.LIKE);

        // Create sample messages
        createMessage("dm-" + Math.min(alice.getId(), bob.getId()) + "-" + Math.max(alice.getId(), bob.getId()),
                alice, "Hey Bob! Lust auf das Donauinselfest?");
        createMessage("dm-" + Math.min(alice.getId(), bob.getId()) + "-" + Math.max(alice.getId(), bob.getId()),
                bob, "Ja voll! Lass uns zusammen hingehen!");
        createMessage("event-" + e1.getId(), alice, "Wer kommt alles zum Donauinselfest? 🎵");
        createMessage("event-" + e1.getId(), bob, "Ich bin dabei! Treffen um 14 Uhr?");

        createNotification(alice, "FRIEND_ACCEPTED", "Bob hat deine Freundschaftsanfrage angenommen!", null);
        createNotification(alice, "EVENT_APPROVED", "Dein Event \"Yoga im Park\" wurde freigegeben!", e7.getId());
        createNotification(bob, "FRIEND_REQUEST", "Carla Schneider hat dir eine Freundschaftsanfrage gesendet.", null);
        createNotification(admin, "NEW_REPORT", "Neue Meldung eingegangen", null);
    }

    private User createUser(String username, String email, String password, String displayName,
                            LocalDate birthdate, String city, UserRole role, boolean verified,
                            Set<String> interests) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setBirthdate(birthdate);
        user.setCity(city);
        user.setRole(role);
        user.setVerified(verified);
        user.setInterests(interests);
        return userRepository.save(user);
    }

    private Event createEvent(String title, String description, String category,
                              int startDaysFromNow, int endDaysFromNow,
                              double lat, double lng, String address,
                              EventSource source, EventState state, User creator,
                              String rejectionReason) {
        Event event = new Event();
        event.setTitle(title);
        event.setDescription(description);
        event.setCategory(category);
        event.setStartTime(LocalDateTime.now().plusDays(startDaysFromNow));
        event.setEndTime(LocalDateTime.now().plusDays(endDaysFromNow).plusHours(3));
        event.setLatitude(lat);
        event.setLongitude(lng);
        event.setAddress(address);
        event.setSource(source);
        event.setState(state);
        event.setCreator(creator);
        event.setRejectionReason(rejectionReason);
        return eventRepository.save(event);
    }

    private void createFriendship(User requester, User receiver, FriendshipStatus status) {
        Friendship f = new Friendship();
        f.setRequester(requester);
        f.setReceiver(receiver);
        f.setStatus(status);
        friendshipRepository.save(f);
    }

    private void createRating(User user, Event event, RatingValue value) {
        Rating r = new Rating();
        r.setUser(user);
        r.setEvent(event);
        r.setValue(value);
        ratingRepository.save(r);
    }

    private void createMessage(String chatId, User sender, String text) {
        Message m = new Message();
        m.setChatId(chatId);
        m.setSender(sender);
        m.setText(text);
        m.setSentAt(LocalDateTime.now().minusMinutes(30));
        messageRepository.save(m);
    }

    private void createNotification(User user, String type, String message, Long relatedId) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setRelatedId(relatedId);
        notificationRepository.save(n);
    }
}