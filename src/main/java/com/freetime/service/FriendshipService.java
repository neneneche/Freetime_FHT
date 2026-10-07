package com.freetime.service;

import com.freetime.model.Block;
import com.freetime.model.Friendship;
import com.freetime.model.User;
import com.freetime.model.enums.FriendshipStatus;
import com.freetime.repository.BlockRepository;
import com.freetime.repository.FriendshipRepository;
import com.freetime.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final NotificationService notificationService;

    public FriendshipService(FriendshipRepository friendshipRepository,
                             UserRepository userRepository,
                             BlockRepository blockRepository,
                             NotificationService notificationService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.notificationService = notificationService;
    }

    public Map<String, Object> sendRequest(Long requesterId, Long receiverId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Empfänger nicht gefunden"));

        if (requesterId.equals(receiverId)) throw new RuntimeException("Eigene Anfrage nicht möglich");

        if (blockRepository.existsByBlockerAndBlocked(receiver, requester)) {
            throw new RuntimeException("Nutzer blockiert");
        }

        friendshipRepository.findByRequesterAndReceiver(requester, receiver)
                .ifPresent(f -> { throw new RuntimeException("Anfrage bereits gesendet"); });

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setReceiver(receiver);
        friendship.setStatus(FriendshipStatus.ANGEFRAGT);
        friendship = friendshipRepository.save(friendship);

        notificationService.notify(receiver, "FRIEND_REQUEST",
                requester.getDisplayName() + " hat dir eine Freundschaftsanfrage gesendet.",
                friendship.getId());

        return toFriendshipMap(friendship);
    }

    public Map<String, Object> acceptRequest(Long userId, Long friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Anfrage nicht gefunden"));
        if (!f.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Nicht berechtigt");
        }
        f.setStatus(FriendshipStatus.BESTAETIGT);
        f = friendshipRepository.save(f);

        User requester = f.getRequester();
        notificationService.notify(requester, "FRIEND_ACCEPTED",
                f.getReceiver().getDisplayName() + " hat deine Freundschaftsanfrage angenommen!",
                f.getId());

        return toFriendshipMap(f);
    }

    public void declineRequest(Long userId, Long friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Anfrage nicht gefunden"));
        if (!f.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Nicht berechtigt");
        }
        friendshipRepository.delete(f);
    }

    public void removeFriend(Long userId, Long friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Freundschaft nicht gefunden"));
        if (!f.getRequester().getId().equals(userId) && !f.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Nicht berechtigt");
        }
        friendshipRepository.delete(f);
    }

    public List<Map<String, Object>> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return friendshipRepository.findByRequesterOrReceiver(user, user).stream()
                .filter(f -> f.getStatus() == FriendshipStatus.BESTAETIGT)
                .map(f -> {
                    User other = f.getRequester().getId().equals(userId) ? f.getReceiver() : f.getRequester();
                    Map<String, Object> m = new HashMap<>();
                    m.put("friendshipId", f.getId());
                    m.put("userId", other.getId());
                    m.put("username", other.getUsername());
                    m.put("displayName", other.getDisplayName());
                    m.put("profilePictureUrl", other.getProfilePictureUrl());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return friendshipRepository.findByReceiverAndStatus(user, FriendshipStatus.ANGEFRAGT).stream()
                .map(this::toFriendshipMap)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toFriendshipMap(Friendship f) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", f.getId());
        m.put("requesterId", f.getRequester().getId());
        m.put("requesterUsername", f.getRequester().getUsername());
        m.put("receiverId", f.getReceiver().getId());
        m.put("receiverUsername", f.getReceiver().getUsername());
        m.put("status", f.getStatus().name());
        return m;
    }
}