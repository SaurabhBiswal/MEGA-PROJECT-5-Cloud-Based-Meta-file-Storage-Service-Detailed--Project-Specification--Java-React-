package com.cloudstorage.controller;

import com.cloudstorage.model.File;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import com.cloudstorage.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final UserRepository userRepository;
    private final com.cloudstorage.security.JwtUtils jwtUtils;
    private final com.cloudstorage.service.UserDetailsServiceImpl userDetailsService;

    // Helper method to get current user with optional token override
    private User getCurrentUser(String token) {
        String email;
        if (token != null) {
            email = jwtUtils.extractUsername(token);
        } else {
            email = SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User getCurrentUser() {
        return getCurrentUser(null);
    }

    // Upload file
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) UUID folderId) {

        try {
            User user = getCurrentUser();
            File savedFile = fileService.uploadFile(file, user, folderId);

            return ResponseEntity.ok(new FileResponse(
                    savedFile.getId(),
                    savedFile.getFileName(),
                    savedFile.getFileType(),
                    savedFile.getFileSize(),
                    "File uploaded successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    // Get user's files
    @GetMapping("/my-files")
    public ResponseEntity<List<File>> getMyFiles() {
        try {
            User user = getCurrentUser();
            List<File> files = fileService.getUserFiles(user);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get files in specific folder (or root if null)
    @GetMapping({ "/list", "/list/{folderId}" })
    public ResponseEntity<List<File>> getFilesInFolder(@PathVariable(required = false) UUID folderId) {
        try {
            User user = getCurrentUser();
            List<File> files = fileService.getFilesInFolder(user, folderId);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Download file
    @GetMapping("/{fileId}/download")
    public ResponseEntity<?> downloadFile(
            @PathVariable UUID fileId,
            @RequestParam(value = "token", required = false) String token) {
        try {
            User user = getCurrentUser(token);
            File file = fileService.getFile(fileId, user);

            // Since FileService now stores absolute path, use it directly
            Path absolutePath = Paths.get(file.getFilePath());

            Resource resource = new org.springframework.core.io.FileSystemResource(absolutePath);

            System.out.println("DEBUG: Downloading file: " + file.getFileName());
            System.out.println("DEBUG: Stored Absolute Path: " + absolutePath);
            System.out.println("DEBUG: Exists? " + resource.exists());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(file.getFileType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + file.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.status(404).body("File not found at: " + absolutePath);
            }
        } catch (RuntimeException e) {
            System.err.println("ERROR in downloadFile: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("UNEXPECTED ERROR in downloadFile: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    // Delete file (move to trash)
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            fileService.deleteFile(fileId, user);
            return ResponseEntity.ok("File moved to trash");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Search files
    @GetMapping("/search")
    public ResponseEntity<List<File>> searchFiles(@RequestParam("query") String query) {
        try {
            User user = getCurrentUser();
            List<File> files = fileService.searchFiles(user, query);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Rename file
    @PutMapping("/{fileId}/rename")
    public ResponseEntity<?> renameFile(
            @PathVariable UUID fileId,
            @RequestParam("newName") String newName) {
        try {
            User user = getCurrentUser();
            File file = fileService.renameFile(fileId, newName, user);
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Move file
    @PutMapping("/{fileId}/move")
    public ResponseEntity<?> moveFile(
            @PathVariable UUID fileId,
            @RequestParam(value = "folderId", required = false) UUID folderId) {
        try {
            User user = getCurrentUser();
            File file = fileService.moveFile(fileId, folderId, user);
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Advanced Search
    @GetMapping("/search/advanced")
    public ResponseEntity<List<File>> advancedSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) Long minSize,
            @RequestParam(required = false) Long maxSize,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {

        try {
            User user = getCurrentUser();
            List<File> files = fileService.advancedSearchFiles(user, query, fileType, minSize, maxSize, startDate,
                    endDate);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get starred files
    @GetMapping("/starred")
    public ResponseEntity<List<File>> getStarredFiles() {
        try {
            User user = getCurrentUser();
            List<File> files = fileService.getStarredFiles(user);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get trashed files
    @GetMapping("/trash-items")
    public ResponseEntity<List<File>> getTrashedFiles() {
        try {
            User user = getCurrentUser();
            List<File> files = fileService.getTrashedFiles(user);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Toggle star status
    @PostMapping("/{fileId}/star")
    public ResponseEntity<?> toggleStar(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            File file = fileService.toggleStar(fileId, user);
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Restore file
    @PostMapping("/{fileId}/restore")
    public ResponseEntity<?> restoreFile(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            fileService.restoreFile(fileId, user);
            return ResponseEntity.ok("File restored successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Permanent delete
    @DeleteMapping("/{fileId}/permanent")
    public ResponseEntity<?> permanentDeleteFile(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            fileService.permanentDeleteFile(fileId, user);
            return ResponseEntity.ok("File deleted permanently");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Generate public link
    @PostMapping("/{fileId}/public-link")
    public ResponseEntity<?> generatePublicLink(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            String token = fileService.generatePublicLink(fileId, user);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Revoke public link
    @DeleteMapping("/{fileId}/public-link")
    public ResponseEntity<?> revokePublicLink(@PathVariable UUID fileId) {
        try {
            User user = getCurrentUser();
            fileService.revokePublicLink(fileId, user);
            return ResponseEntity.ok("Public link revoked");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get public file info (NO AUTH)
    @GetMapping("/public/{token}")
    public ResponseEntity<?> getPublicFile(@PathVariable String token) {
        try {
            File file = fileService.getFileByPublicToken(token);
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // Download public file (NO AUTH) - Optimized for Streaming
    @GetMapping("/public/download/{token}")
    public ResponseEntity<Resource> getPublicFileDownload(@PathVariable String token) {
        try {
            File file = fileService.getFileByPublicToken(token);
            Path filePath = Paths.get(file.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = file.getFileType() != null ? file.getFileType() : "application/octet-stream";
                // Use "inline" for media to allow streaming/preview
                String disposition = "inline; filename=\"" + file.getFileName() + "\"";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}

// Response DTO
record FileResponse(
        UUID id,
        String fileName,
        String fileType,
        Long fileSize,
        String message) {
}
