package com.cloudstorage.controller;

import com.cloudstorage.dto.AuthRequest;
import com.cloudstorage.model.User;
import com.cloudstorage.service.AuthService;
import com.cloudstorage.security.JwtUtils;
import com.cloudstorage.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {
            if (request.getName() == null || request.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }

            User user = authService.register(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName());
            return ResponseEntity.ok("User registered successfully! ID: " + user.getId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            final String jwt = jwtUtils.generateToken(userDetails);

            return ResponseEntity.ok(new AuthResponse(jwt, "Login successful!"));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(401).body("Invalid email or password");
        } catch (Exception e) {
            e.printStackTrace(); // Log the real error for debugging
            return ResponseEntity.badRequest().body("Login error: " + e.getMessage());
        }
    }

    @org.springframework.beans.factory.annotation.Value("${google.client-id:placeholder}")
    private String googleClientId;

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody com.cloudstorage.dto.GoogleAuthRequest request) {
        try {
            com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier verifier = new com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.Builder(
                    new com.google.api.client.http.javanet.NetHttpTransport(),
                    new com.google.api.client.json.gson.GsonFactory())
                    .setAudience(java.util.Collections.singletonList(googleClientId))
                    .build();

            com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Auto-register or get existing user
                User user = authService.registerOrGetGoogleUser(email, name);

                final UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                final String jwt = jwtUtils.generateToken(userDetails);

                return ResponseEntity.ok(new AuthResponse(jwt, "Google Login successful!"));
            } else {
                return ResponseEntity.badRequest().body("Invalid Google Token");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Google Auth failed: " + e.getMessage());
        }
    }
}

record AuthResponse(String token, String message) {
}