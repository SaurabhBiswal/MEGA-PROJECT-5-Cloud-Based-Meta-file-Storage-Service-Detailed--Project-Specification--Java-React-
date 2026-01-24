package com.cloudstorage.controller;

import com.cloudstorage.model.User;
import com.cloudstorage.repository.UserRepository;
import com.cloudstorage.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final FileService fileService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/usage")
    public ResponseEntity<?> getStorageUsage() {
        try {
            User user = getCurrentUser();
            long totalBytes = fileService.calculateUserStorage(user);
            long limitBytes = 10L * 1024 * 1024 * 1024; // 10 GB limit

            Map<String, Object> response = new HashMap<>();
            response.put("usedBytes", totalBytes);
            response.put("totalBytes", limitBytes);
            response.put("usedGB", String.format("%.2f", totalBytes / (1024.0 * 1024 * 1024)));
            response.put("totalGB", 10);
            response.put("percentageUsed", Math.min(100, (int) ((totalBytes * 100) / limitBytes)));
            response.put("readableUsed", formatSize(totalBytes));
            response.put("readableTotal", "10 GB");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/breakdown")
    public ResponseEntity<?> getStorageBreakdown() {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(fileService.getUserFiles(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private String formatSize(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
