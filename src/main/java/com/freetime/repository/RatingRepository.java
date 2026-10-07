package com.freetime.repository;

import com.freetime.model.Event;
import com.freetime.model.Rating;
import com.freetime.model.User;
import com.freetime.model.enums.RatingValue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserAndEvent(User user, Event event);
    List<Rating> findByUser(User user);
    List<Rating> findByUserAndValue(User user, RatingValue value);
    List<Rating> findByEventAndValue(Event event, RatingValue value);
    long countByEventAndValue(Event event, RatingValue value);
}