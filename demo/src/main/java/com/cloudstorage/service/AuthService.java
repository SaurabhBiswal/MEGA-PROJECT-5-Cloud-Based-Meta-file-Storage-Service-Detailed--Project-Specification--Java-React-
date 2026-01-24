package com.cloudstorage.service;

import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public User register(String email, String password, String name) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists");
        }

        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password)); // Password encrypt
        user.setName(name);

        User savedUser = userRepository.save(user);

        // Send Welcome Email (Non-blocking)
        try {
            emailService.sendEmail(
                    savedUser.getEmail(),
                    "Welcome to CloudBox!",
                    "<h1>Welcome " + savedUser.getName() + "!</h1><p>Your secure cloud storage is ready.</p>",
                    "CloudBox Team",
                    "noreply@cloudbox.com");
        } catch (Exception e) {
            // Log error but don't fail registration
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        return savedUser;
    }

    public User login(String email, String password) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check password
        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }

    public User registerOrGetGoogleUser(String email, String name) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            // Google users don't have a standard password
            // We set a random one so they can't be guessed
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        });
    }
}