package com.cloudstorage.controller;

import com.cloudstorage.model.Share;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import com.cloudstorage.service.ShareService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if (email == null || email.equals("anonymousUser")) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "User not authenticated");
            }
            return userRepository.findByEmail(email).orElseThrow(
                    () -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.UNAUTHORIZED, "User not found"));
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Auth failure");
        }
    }

    @PostMapping
    public ResponseEntity<?> shareFile(@RequestBody ShareRequest request) {

        try {
            User user = getCurrentUser();
            Object result = shareService.shareFile(
                    request.getFileId(),
                    request.getEmail(),
                    Share.Permission.valueOf(request.getPermission()),
                    user);

            if (result instanceof java.util.Map) {
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.ok(result);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Share failure: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<?> getSharedWithMe() {
        try {
            User user = getCurrentUser();
            List<Share> shares = shareService.getSharedWithMe(user);
            return ResponseEntity.ok(shares);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/shared-by-me")
    public ResponseEntity<?> getSharedByMe() {
        try {
            User user = getCurrentUser();
            List<Share> shares = shareService.getSharedByMe(user);
            return ResponseEntity.ok(shares);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/file/{fileId}")
    public ResponseEntity<?> getFileShares(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            List<Share> shares = shareService.getFileShares(fileId, user);
            return ResponseEntity.ok(shares);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Fetch shares failed for {}: {}", fileId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{shareId}")
    public ResponseEntity<?> revokeShare(@PathVariable UUID shareId) {

        try {
            User user = getCurrentUser();
            shareService.revokeShare(shareId, user);
            return ResponseEntity.ok("Share revoked successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

@Data
class ShareRequest {
    private UUID fileId;
    private String email;
    private String permission; // VIEWER or EDITOR
}
