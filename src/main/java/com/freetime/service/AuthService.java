package com.freetime.service;

import com.freetime.dto.AuthResponse;
import com.freetime.dto.LoginRequest;
import com.freetime.dto.RegisterRequest;
import com.freetime.model.User;
import com.freetime.model.enums.UserRole;
import com.freetime.repository.UserRepository;
import com.freetime.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#+\\-_])[A-Za-z\\d@$!%*?&#+\\-_]{12,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Benutzername bereits vergeben");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("E-Mail bereits registriert");
        }
        if (!PASSWORD_PATTERN.matcher(req.getPassword()).matches()) {
            throw new RuntimeException("Passwort: mind. 12 Zeichen, Groß-/Kleinbuchstabe, Ziffer, Sonderzeichen");
        }

        LocalDate birthdate = LocalDate.parse(req.getBirthdate());
        int age = Period.between(birthdate, LocalDate.now()).getYears();
        if (age < 16) {
            throw new RuntimeException("Mindestalter: 16 Jahre");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setDisplayName(req.getDisplayName());
        user.setBirthdate(birthdate);
        user.setCity(req.getCity());
        user.setProfilePictureUrl(req.getProfilePictureUrl());
        if (req.getInterests() != null) {
            user.setInterests(req.getInterests());
        }
        user.setRole(UserRole.USER);

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Ungültige Anmeldedaten"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Ungültige Anmeldedaten");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name());
    }
}