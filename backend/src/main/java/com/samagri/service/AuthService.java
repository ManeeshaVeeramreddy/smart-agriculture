package com.samagri.service;

import com.samagri.config.JwtTokenProvider;
import com.samagri.dto.AuthRequest;
import com.samagri.dto.AuthResponse;
import com.samagri.dto.RegisterRequest;
import com.samagri.exception.BadRequestException;
import com.samagri.exception.DuplicateResourceException;
import com.samagri.exception.UnauthorizedException;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String phone = normalizePhone(request.getPhone());
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if (email.isEmpty() && phone == null) {
            throw new BadRequestException("Please give a mobile number or an email address.");
        }
        if (email.isEmpty()) {
            // Farmers without e-mail sign up with a phone number; keep the unique e-mail column filled.
            email = phone.replace("+", "") + "@phone.sams.local";
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("An account with this mobile number already exists.");
        }

        // Public sign-up always creates a FARMER; administrator accounts are never self-service.
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.FARMER);

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser);

        return new AuthResponse(
                token,
                savedUser.getUserId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );
    }

    /** Logs in with an e-mail address OR a mobile number (the DTO field is still called "email"). */
    public AuthResponse login(AuthRequest request) {
        String identifier = request.getEmail().trim();
        String phone = identifier.contains("@") ? null : normalizePhone(identifier);
        if (!identifier.contains("@") && phone == null) {
            throw new UnauthorizedException("Invalid phone/email or password.");
        }
        User user = (phone == null
                ? userRepository.findByEmail(identifier.toLowerCase())
                : userRepository.findByPhone(phone))
                .orElseThrow(() -> new UnauthorizedException("Invalid phone/email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid phone/email or password.");
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(
                token,
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    /** Keeps digits (and a leading +); returns null for blank input. */
    static String normalizePhone(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        String digits = trimmed.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return null;
        }
        return trimmed.startsWith("+") ? "+" + digits : digits;
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException("User is not authenticated. Please log in.");
        }

        if (auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found in database."));
    }
}
