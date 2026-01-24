package com.cloudstorage.controller;

import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import com.cloudstorage.service.FolderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;
    private final UserRepository userRepository;

    // Helper method to get current user from SecurityContext
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Create folder
    @PostMapping
    public ResponseEntity<?> createFolder(@RequestBody CreateFolderRequest request) {

        try {
            User user = getCurrentUser();
            Folder folder = folderService.createFolder(
                    request.getName(),
                    user,
                    request.getParentFolderId());
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get user's folders
    @GetMapping
    public ResponseEntity<List<Folder>> getMyFolders() {
        try {
            User user = getCurrentUser();
            List<Folder> folders = folderService.getUserFolders(user);
            return ResponseEntity.ok(folders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get root folders
    @GetMapping("/root")
    public ResponseEntity<List<Folder>> getRootFolders() {
        try {
            User user = getCurrentUser();
            List<Folder> folders = folderService.getRootFolders(user);
            return ResponseEntity.ok(folders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get subfolders
    @GetMapping("/{folderId}/subfolders")
    public ResponseEntity<List<Folder>> getSubfolders(@PathVariable UUID folderId) {

        try {
            User user = getCurrentUser();
            List<Folder> folders = folderService.getSubfolders(user, folderId);
            return ResponseEntity.ok(folders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get specific folder
    @GetMapping("/{folderId}")
    public ResponseEntity<?> getFolder(@PathVariable UUID folderId) {

        try {
            User user = getCurrentUser();
            Folder folder = folderService.getFolder(folderId, user);
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Delete folder
    @DeleteMapping("/{folderId}")
    public ResponseEntity<?> deleteFolder(@PathVariable UUID folderId) {

        try {
            User user = getCurrentUser();
            folderService.deleteFolder(folderId, user);
            return ResponseEntity.ok("Folder moved to trash");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Rename folder
    @PutMapping("/{folderId}/rename")
    public ResponseEntity<?> renameFolder(
            @PathVariable UUID folderId,
            @RequestParam("newName") String newName) {

        try {
            User user = getCurrentUser();
            Folder folder = folderService.renameFolder(folderId, newName, user);
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Move folder
    @PutMapping("/{folderId}/move")
    public ResponseEntity<?> moveFolder(
            @PathVariable UUID folderId,
            @RequestParam(value = "targetFolderId", required = false) UUID targetFolderId) {

        try {
            User user = getCurrentUser();
            Folder folder = folderService.moveFolder(folderId, targetFolderId, user);
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

@Data
class CreateFolderRequest {
    private String name;
    private UUID parentFolderId;
}
