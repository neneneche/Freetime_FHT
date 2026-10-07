package com.freetime.repository;

import com.freetime.model.Block;
import com.freetime.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {
    Optional<Block> findByBlockerAndBlocked(User blocker, User blocked);
    boolean existsByBlockerAndBlocked(User blocker, User blocked);
}