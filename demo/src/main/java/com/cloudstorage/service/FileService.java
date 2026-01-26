package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FolderRepository;
import com.cloudstorage.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final ShareRepository shareRepository;
    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseKey;

    @Value("${supabase.bucket-name:cloud-storage}")
    private String bucketName;

    // Upload file to Supabase Storage
    public File uploadFile(MultipartFile multipartFile, User user, UUID folderId) {
        try {
            if (multipartFile.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            String originalFilename = multipartFile.getOriginalFilename();
            String fileExtension = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            String supabasePath = user.getId() + "/" + uniqueFileName;

            // Supabase Upload Request
            String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + supabasePath;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(multipartFile.getContentType()));
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            // Use getResource() for streaming instead of getBytes() to prevent OOM
            HttpEntity<org.springframework.core.io.Resource> request = new HttpEntity<>(multipartFile.getResource(),
                    headers);

            log.info("Streaming file to Supabase: {} (Size: {} bytes)", url, multipartFile.getSize());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Supabase upload failed: " + response.getBody());
            }

            // Get public URL (Assuming bucket is public for simplicity in this project)
            String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + supabasePath;

            // Get folder if specified
            Folder folder = null;
            if (folderId != null) {
                folder = folderRepository.findById(folderId)
                        .orElseThrow(() -> new RuntimeException("Folder not found"));
                if (!folder.getUser().getId().equals(user.getId())) {
                    throw new RuntimeException("Access denied to folder");
                }
            }

            // Create file metadata in DB
            File file = new File();
            file.setFileName(originalFilename);
            file.setFilePath(publicUrl); // Now storing the permanent cloud URL
            file.setFileType(multipartFile.getContentType());
            file.setFileSize(multipartFile.getSize());
            file.setUser(user);
            file.setFolder(folder);

            return fileRepository.save(file);

        } catch (Exception e) {
            log.error("Cloud upload error: {}", e.getMessage());
            throw new RuntimeException("Could not upload to cloud: " + e.getMessage());
        }
    }

    public List<File> getUserFiles(User user) {
        return fileRepository.findByUserAndIsTrashedFalse(user);
    }

    public List<File> getFilesInFolder(User user, UUID folderId) {
        if (folderId == null) {
            return fileRepository.findByUserAndFolderIsNullAndIsTrashedFalse(user);
        }
        return fileRepository.findByUserAndFolderIdAndIsTrashedFalse(user, folderId);
    }

    public File getFile(UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        boolean isOwner = file.getUser().getId().toString().equals(user.getId().toString());
        boolean isShared = shareRepository.existsByFileIdAndSharedWith(fileId, user);
        if (!isOwner && !isShared) {
            throw new RuntimeException("Access denied");
        }
        return file;
    }

    public void deleteFile(UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // If user is the owner, move to trash
        if (file.getUser().getId().toString().equals(user.getId().toString())) {
            file.setIsTrashed(true);
            fileRepository.save(file);
            return;
        }

        // If user is a recipient, revoke their access only (Remove from their view)
        com.cloudstorage.model.Share share = shareRepository.findByFileIdAndSharedWith(fileId, user)
                .orElseThrow(
                        () -> new RuntimeException("Access denied: You do not have permission to remove this file."));

        shareRepository.delete(share);
        log.info("Access revoked for user {} on shared file {}", user.getEmail(), file.getFileName());
    }

    public void restoreFile(UUID fileId, User user) {
        File file = getFile(fileId, user);
        file.setIsTrashed(false);
        fileRepository.save(file);
    }

    public List<File> getTrashedFiles(User user) {
        return fileRepository.findByUserAndIsTrashedTrue(user);
    }

    public List<File> getStarredFiles(User user) {
        return fileRepository.findByUserAndIsStarredTrueAndIsTrashedFalse(user);
    }

    public Object toggleStar(UUID fileId, User user) {
        File file = fileRepository.findById(fileId).orElseThrow();

        // 1. If Owner, toggle File star
        if (file.getUser().getId().toString().equals(user.getId().toString())) {
            file.setIsStarred(file.getIsStarred() == null ? true : !file.getIsStarred());
            return fileRepository.save(file);
        }

        // 2. If Shared Recipient, toggle Share star
        com.cloudstorage.model.Share share = shareRepository.findByFileIdAndSharedWith(fileId, user)
                .orElseThrow(() -> new RuntimeException("Access denied: You don't have permission to star this file."));

        share.setIsStarred(share.getIsStarred() == null ? true : !share.getIsStarred());
        return shareRepository.save(share);
    }

    public void permanentDeleteFile(UUID fileId, User user) {
        File file = getFile(fileId, user);

        // Delete from Supabase
        try {
            String path = file.getFilePath();
            String filename = path.substring(path.lastIndexOf("/") + 1);
            String supabasePath = user.getId() + "/" + filename;

            String url = supabaseUrl + "/storage/v1/object/" + bucketName;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            Map<String, List<String>> body = Map.of("prefixes", List.of(supabasePath));
            HttpEntity<Map<String, List<String>>> request = new HttpEntity<>(body, headers);

            restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            log.info("Deleted from Supabase: {}", supabasePath);
        } catch (Exception e) {
            log.warn("Could not delete from Supabase: {}", e.getMessage());
        }

        fileRepository.delete(file);
    }

    public List<File> searchFiles(User user, String query) {
        return fileRepository.findByUserAndFileNameContainingIgnoreCaseAndIsTrashedFalse(user, query);
    }

    public List<File> getRecentFiles(User user) {
        // 1. Get owned files sorted by lastOpenedAt
        List<File> ownedFiles = fileRepository.findByUserAndIsTrashedFalse(user);

        // 2. Get shared files
        List<com.cloudstorage.model.Share> sharedWithMe = shareRepository.findBySharedWith(user);
        List<File> sharedFiles = sharedWithMe.stream()
                .map(com.cloudstorage.model.Share::getFile)
                .filter(f -> !f.getIsTrashed())
                .toList();

        // 3. Combine and sort
        java.util.List<File> combined = new java.util.ArrayList<>();
        combined.addAll(ownedFiles);
        combined.addAll(sharedFiles);

        return combined.stream()
                .sorted((f1, f2) -> {
                    LocalDateTime t1 = f1.getLastOpenedAt() != null ? f1.getLastOpenedAt() : f1.getCreatedAt();
                    LocalDateTime t2 = f2.getLastOpenedAt() != null ? f2.getLastOpenedAt() : f2.getCreatedAt();
                    // For shared files, we actually want to check the Share record's lastOpenedAt
                    // if possible
                    // But for simplicity, we'll use the file's timestamp for now or refine if
                    // needed.
                    return t2.compareTo(t1);
                })
                .limit(20)
                .toList();
    }

    public void reportFileOpen(UUID fileId, User user) {
        try {
            File file = fileRepository.findById(fileId).orElseThrow();
            boolean isOwner = file.getUser().getId().toString().equals(user.getId().toString());

            if (isOwner) {
                file.setLastOpenedAt(LocalDateTime.now());
                fileRepository.save(file);
            } else {
                shareRepository.findByFileIdAndSharedWith(fileId, user).ifPresent(share -> {
                    share.setLastOpenedAt(LocalDateTime.now());
                    shareRepository.save(share);
                    // Also update file's general lastOpened for global recent (Optional)
                    file.setLastOpenedAt(LocalDateTime.now());
                    fileRepository.save(file);
                });
            }
        } catch (Exception e) {
            log.warn("Failed to report file open: {}", e.getMessage());
        }
    }

    public List<File> advancedSearchFiles(User user, String query, String fileType, Long minSize, Long maxSize,
            LocalDateTime startDate, LocalDateTime endDate) {
        return fileRepository.findAll(com.cloudstorage.repository.FileSpecification.hasUser(user));
    }

    public File renameFile(UUID fileId, String newName, User user) {
        File file = getFile(fileId, user);
        checkPermission(fileId, user, com.cloudstorage.model.Share.Permission.EDITOR);
        file.setFileName(newName);
        return fileRepository.save(file);
    }

    public File moveFile(UUID fileId, UUID targetFolderId, User user) {
        File file = fileRepository.findById(fileId).orElseThrow();
        if (!file.getUser().getId().toString().equals(user.getId().toString())) {
            throw new RuntimeException("Only the owner can move this file to a folder.");
        }
        if (targetFolderId != null) {
            Folder targetFolder = folderRepository.findById(targetFolderId)
                    .orElseThrow(() -> new RuntimeException("Folder not found"));
            file.setFolder(targetFolder);
        } else {
            file.setFolder(null);
        }
        return fileRepository.save(file);
    }

    private void checkPermission(UUID fileId, User user, com.cloudstorage.model.Share.Permission required) {
        File file = fileRepository.findById(fileId).orElseThrow();
        if (file.getUser().getId().toString().equals(user.getId().toString()))
            return; // Owner has all permissions

        com.cloudstorage.model.Share share = shareRepository.findByFileIdAndSharedWith(fileId, user)
                .orElseThrow(() -> new RuntimeException("Access denied"));

        if (required == com.cloudstorage.model.Share.Permission.EDITOR &&
                share.getPermission() != com.cloudstorage.model.Share.Permission.EDITOR) {
            throw new RuntimeException("Editor permission required for this action");
        }
    }

    public long calculateUserStorage(User user) {
        return fileRepository.findByUserAndIsTrashedFalse(user).stream()
                .mapToLong(File::getFileSize).sum();
    }

    public String generatePublicLink(UUID fileId, User user) {
        File file = getFile(fileId, user);
        if (file.getPublicShareToken() == null) {
            file.setPublicShareToken(UUID.randomUUID().toString());
            fileRepository.save(file);
        }
        return file.getPublicShareToken();
    }

    public void revokePublicLink(UUID fileId, User user) {
        File file = getFile(fileId, user);
        file.setPublicShareToken(null);
        fileRepository.save(file);
    }

    public File getFileByPublicToken(String token) {
        return fileRepository.findByPublicShareToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid link"));
    }

    public String generateSignedUrl(File file) {
        try {
            // Extract path from public URL robustly
            String path = file.getFilePath();
            String supabasePath;

            // Handle different URL formats
            if (path.contains("/object/public/" + bucketName + "/")) {
                supabasePath = path.substring(path.indexOf("/object/public/" + bucketName + "/")
                        + ("/object/public/" + bucketName + "/").length());
            } else if (path.contains("/object/" + bucketName + "/")) {
                supabasePath = path.substring(
                        path.indexOf("/object/" + bucketName + "/") + ("/object/" + bucketName + "/").length());
            } else if (path.contains(bucketName + "/")) {
                supabasePath = path.substring(path.indexOf(bucketName + "/") + (bucketName + "/").length());
            } else {
                // Fallback: assume path IS the relative path if no bucket found
                supabasePath = path;
            }

            String url = supabaseUrl + "/storage/v1/object/sign/" + bucketName + "/" + supabasePath;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            // Generate a 2-hour signed URL (7200 seconds)
            Map<String, Object> body = Map.of("expiresIn", 7200);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String signedPath = (String) response.getBody().get("signedURL");
                // Supabase typically returns the full path starting from /storage/v1/
                return supabaseUrl + signedPath;
            }
            throw new RuntimeException("Supabase sign failed: " + response.getBody());
        } catch (Exception e) {
            log.error("Failed to generate signed URL for file {}: {}", file.getFileName(), e.getMessage());
            // Fallback to current stored path if signing fails
            return file.getFilePath();
        }
    }
}
