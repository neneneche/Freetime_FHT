package com.freetime.repository;

import com.freetime.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatIdOrderBySentAtAsc(String chatId);
    long countByChatId(String chatId);
}