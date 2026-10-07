package com.freetime.repository;

import com.freetime.model.Event;
import com.freetime.model.User;
import com.freetime.model.enums.EventSource;
import com.freetime.model.enums.EventState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByState(EventState state);
    List<Event> findByStateOrSource(EventState state, EventSource source);
    List<Event> findByCreator(User creator);
    long countByCreatorAndStateNot(User creator, EventState excludedState);
}