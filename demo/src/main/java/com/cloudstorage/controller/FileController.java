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
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final UserRepository userRepository;
    private final com.cloudstorage.security.JwtUtils jwtUtils;
    private final RestTemplate restTemplate;

    private User getCurrentUser(String token) {
        try {
            String email = (token != null && !token.equals("null") && !token.isEmpty())
                    ? jwtUtils.extractUsername(token)
                    : SecurityContextHolder.getContext().getAuthentication().getName();

            if (email == null || email.equals("anonymousUser")) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "User not authenticated");
            }

            return userRepository.findByEmail(email).orElseThrow(
                    () -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.UNAUTHORIZED,
                            "User not found"));
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Invalid authentication token");
        }
    }

    private User getCurrentUser() {
        return getCurrentUser(null);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) UUID folderId) {
        try {
            User user = getCurrentUser();
            File savedFile = fileService.uploadFile(file, user, folderId);
            return ResponseEntity.ok(new FileResponse(savedFile.getId(), savedFile.getFileName(),
                    savedFile.getFileType(), savedFile.getFileSize(), "File uploaded successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping({ "/list", "/list/{folderId}" })
    public ResponseEntity<List<File>> getFilesInFolder(@PathVariable(required = false) UUID folderId) {
        try {
            return ResponseEntity.ok(fileService.getFilesInFolder(getCurrentUser(), folderId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<?> downloadFile(@PathVariable UUID fileId,
            @RequestParam(value = "token", required = false) String token) {
        try {
            File file = fileService.getFile(fileId, getCurrentUser(token));
            Resource resource = new UrlResource(URI.create(file.getFilePath()));

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(file.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Download error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable UUID fileId) {
        try {
            fileService.deleteFile(fileId, getCurrentUser());
            return ResponseEntity.ok("File moved to trash");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<File>> searchFiles(@RequestParam("query") String query) {
        try {
            return ResponseEntity.ok(fileService.searchFiles(getCurrentUser(), query));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<File>> getRecentFiles() {
        try {
            return ResponseEntity.ok(fileService.getRecentFiles(getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/starred")
    public ResponseEntity<List<File>> getStarredFiles() {
        try {
            return ResponseEntity.ok(fileService.getStarredFiles(getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/trash-items")
    public ResponseEntity<List<File>> getTrashedFiles() {
        try {
            return ResponseEntity.ok(fileService.getTrashedFiles(getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{fileId}/star")
    public ResponseEntity<?> toggleStar(@PathVariable UUID fileId) {
        try {
            return ResponseEntity.ok(fileService.toggleStar(fileId, getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{fileId}/restore")
    public ResponseEntity<?> restoreFile(@PathVariable UUID fileId) {
        try {
            fileService.restoreFile(fileId, getCurrentUser());
            return ResponseEntity.ok("File restored successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{fileId}/permanent")
    public ResponseEntity<?> permanentDeleteFile(@PathVariable UUID fileId) {
        try {
            fileService.permanentDeleteFile(fileId, getCurrentUser());
            return ResponseEntity.ok("File deleted permanently");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{fileId}/rename")
    public ResponseEntity<?> renameFile(@PathVariable UUID fileId, @RequestParam String newName) {
        try {
            return ResponseEntity.ok(fileService.renameFile(fileId, newName, getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{fileId}/move")
    public ResponseEntity<?> moveFile(@PathVariable UUID fileId, @RequestParam(required = false) UUID folderId) {
        try {
            return ResponseEntity.ok(fileService.moveFile(fileId, folderId, getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{fileId}/public-link")
    public ResponseEntity<?> generatePublicLink(@PathVariable UUID fileId) {
        try {
            String token = fileService.generatePublicLink(fileId, getCurrentUser());
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/public/{token}")
    public ResponseEntity<?> getPublicFile(@PathVariable String token) {
        try {
            return ResponseEntity.ok(fileService.getFileByPublicToken(token));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/public/download/{token}")
    public ResponseEntity<Resource> getPublicFileDownload(@PathVariable String token) {
        try {
            File file = fileService.getFileByPublicToken(token);
            Resource resource = new UrlResource(URI.create(file.getFilePath()));

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(file.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}

record FileResponse(UUID id, String fileName, String fileType, Long fileSize, String message) {
}
