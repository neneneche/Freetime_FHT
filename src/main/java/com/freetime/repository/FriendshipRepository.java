package com.freetime.repository;

import com.freetime.model.Friendship;
import com.freetime.model.User;
import com.freetime.model.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    List<Friendship> findByRequesterOrReceiver(User requester, User receiver);
    List<Friendship> findByReceiverAndStatus(User receiver, FriendshipStatus status);
    Optional<Friendship> findByRequesterAndReceiver(User requester, User receiver);
    boolean existsByRequesterAndReceiverAndStatus(User a, User b, FriendshipStatus status);
}