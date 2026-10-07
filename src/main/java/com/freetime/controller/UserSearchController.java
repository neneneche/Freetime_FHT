package com.freetime.controller;

import com.freetime.service.UserSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserSearchController {

    private final UserSearchService userSearchService;

    public UserSearchController(UserSearchService userSearchService) {
        this.userSearchService = userSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(Authentication auth,
                                         @RequestParam(required = false) String q) {
        Long userId = (Long) auth.getDetails();
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(userSearchService.getAllUsers(userId));
        }
        return ResponseEntity.ok(userSearchService.searchUsers(q, userId));
    }
}