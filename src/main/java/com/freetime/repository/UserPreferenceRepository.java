package com.freetime.repository;

import com.freetime.model.UserPreference;
import com.freetime.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    List<UserPreference> findByUser(User user);
    Optional<UserPreference> findByUserAndCategory(User user, String category);
    void deleteByUserAndCategory(User user, String category);
}