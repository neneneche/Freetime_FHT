package com.freetime.service;

import com.freetime.model.*;
import com.freetime.model.enums.FriendshipStatus;
import com.freetime.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RatingRepository ratingRepository;

    public ChatService(MessageRepository messageRepository,
                       FriendshipRepository friendshipRepository,
                       BlockRepository blockRepository,
                       UserRepository userRepository,
                       EventRepository eventRepository,
                       RatingRepository ratingRepository) {
        this.messageRepository = messageRepository;
        this.friendshipRepository = friendshipRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ratingRepository = ratingRepository;
    }

    public Map<String, Object> sendDirectMessage(Long senderId, Long recipientId, String text) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Absender nicht gefunden"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Empfänger nicht gefunden"));

        // Check block
        if (blockRepository.existsByBlockerAndBlocked(recipient, sender)) {
            throw new RuntimeException("Nutzer blockiert");
        }

        // Check friendship
        boolean areFriends = friendshipRepository.existsByRequesterAndReceiverAndStatus(sender, recipient, FriendshipStatus.BESTAETIGT)
                || friendshipRepository.existsByRequesterAndReceiverAndStatus(recipient, sender, FriendshipStatus.BESTAETIGT);
        if (!areFriends) {
            throw new RuntimeException("Nur Freunde können Nachrichten senden");
        }

        if (text.length() > 2000) throw new RuntimeException("Nachricht: max. 2000 Zeichen");

        String chatId = generateDmChatId(senderId, recipientId);
        return saveAndReturn(chatId, sender, text);
    }

    public Map<String, Object> sendGroupMessage(Long senderId, Long eventId, String text) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Veranstaltung nicht gefunden"));

        // Check if user liked the event
        ratingRepository.findByUserAndEvent(sender, event)
                .filter(r -> r.getValue() == com.freetime.model.enums.RatingValue.LIKE)
                .orElseThrow(() -> new RuntimeException("Nur mit Like bewertete Veranstaltungen"));

        if (text.length() > 2000) throw new RuntimeException("Nachricht: max. 2000 Zeichen");

        String chatId = "event-" + eventId;
        return saveAndReturn(chatId, sender, text);
    }

    public List<Map<String, Object>> getMessages(Long userId, String chatId) {
        return messageRepository.findByChatIdOrderBySentAtAsc(chatId).stream()
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("chatId", m.getChatId());
                    map.put("senderId", m.getSender().getId());
                    map.put("senderUsername", m.getSender().getUsername());
                    map.put("text", m.getText());
                    map.put("sentAt", m.getSentAt().toString());
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getConversations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        List<Map<String, Object>> conversations = new ArrayList<>();

        // DM conversations from friends
        List<Friendship> friendships = friendshipRepository.findByRequesterOrReceiver(user, user).stream()
                .filter(f -> f.getStatus() == FriendshipStatus.BESTAETIGT)
                .collect(Collectors.toList());

        for (Friendship f : friendships) {
            User other = f.getRequester().getId().equals(userId) ? f.getReceiver() : f.getRequester();
            String chatId = generateDmChatId(
                    Math.min(f.getRequester().getId(), f.getReceiver().getId()),
                    Math.max(f.getRequester().getId(), f.getReceiver().getId()));

            long count = messageRepository.countByChatId(chatId);
            Map<String, Object> conv = new HashMap<>();
            conv.put("chatId", chatId);
            conv.put("type", "DM");
            conv.put("name", other.getDisplayName());
            conv.put("userId", other.getId());
            conv.put("messageCount", count);
            conversations.add(conv);
        }

        // Group chats from liked events
        List<Rating> likes = ratingRepository.findByUserAndValue(user, com.freetime.model.enums.RatingValue.LIKE);
        for (Rating r : likes) {
            String chatId = "event-" + r.getEvent().getId();
            long count = messageRepository.countByChatId(chatId);
            Map<String, Object> conv = new HashMap<>();
            conv.put("chatId", chatId);
            conv.put("type", "EVENT");
            conv.put("name", r.getEvent().getTitle());
            conv.put("eventId", r.getEvent().getId());
            conv.put("messageCount", count);
            conversations.add(conv);
        }

        return conversations;
    }

    private Map<String, Object> saveAndReturn(String chatId, User sender, String text) {
        Message msg = new Message();
        msg.setChatId(chatId);
        msg.setSender(sender);
        msg.setText(text);
        msg = messageRepository.save(msg);

        Map<String, Object> m = new HashMap<>();
        m.put("id", msg.getId());
        m.put("chatId", msg.getChatId());
        m.put("senderId", msg.getSender().getId());
        m.put("senderUsername", msg.getSender().getUsername());
        m.put("text", msg.getText());
        m.put("sentAt", msg.getSentAt().toString());
        return m;
    }

    private String generateDmChatId(Long id1, Long id2) {
        return "dm-" + Math.min(id1, id2) + "-" + Math.max(id1, id2);
    }
}