package com.cloudstorage.controller;

import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import com.cloudstorage.service.TrashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/trash")
@RequiredArgsConstructor
public class TrashController {

    private final TrashService trashService;
    private final UserRepository userRepository;

    // Helper method to get current user from SecurityContext
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Get trash items
    @GetMapping
    public ResponseEntity<?> getTrash() {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(trashService.getTrash(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Restore file
    @PostMapping("/restore/file/{fileId}")
    public ResponseEntity<?> restoreFile(@PathVariable UUID fileId) {

        try {
            User user = getCurrentUser();
            trashService.restoreFile(fileId, user);
            return ResponseEntity.ok("File restored successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Restore folder
    @PostMapping("/restore/folder/{folderId}")
    public ResponseEntity<?> restoreFolder(@PathVariable UUID folderId) {

        try {
            User user = getCurrentUser();
            trashService.restoreFolder(folderId, user);
            return ResponseEntity.ok("Folder restored successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Permanently delete file
    @DeleteMapping("/file/{fileId}")
    public ResponseEntity<?> permanentDeleteFile(@PathVariable UUID fileId) {

        try {
            User user = getCurrentUser();
            trashService.permanentDeleteFile(fileId, user);
            return ResponseEntity.ok("File permanently deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Permanently delete folder
    @DeleteMapping("/folder/{folderId}")
    public ResponseEntity<?> permanentDeleteFolder(@PathVariable UUID folderId) {

        try {
            User user = getCurrentUser();
            trashService.permanentDeleteFolder(folderId, user);
            return ResponseEntity.ok("Folder permanently deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Empty trash
    @DeleteMapping("/empty")
    public ResponseEntity<?> emptyTrash() {
        try {
            User user = getCurrentUser();
            trashService.emptyTrash(user);
            return ResponseEntity.ok("Trash emptied successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
