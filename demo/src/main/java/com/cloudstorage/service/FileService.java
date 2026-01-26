package com.cloudstorage.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.cloudstorage.model.File;
import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FolderRepository;
import com.cloudstorage.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final ShareRepository shareRepository;
    private final AmazonS3 s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    // Upload file to AWS S3
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
            String s3Path = user.getId() + "/" + uniqueFileName;

            // Prepare metadata
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(multipartFile.getContentType());
            metadata.setContentLength(multipartFile.getSize());

            log.info("Uploading file to S3: {}/{} (Size: {} bytes)", bucketName, s3Path, multipartFile.getSize());

            // Upload to S3
            s3Client.putObject(new PutObjectRequest(bucketName, s3Path, multipartFile.getInputStream(), metadata));

            // Generate a permanent S3 URL (Note: This might not be accessible if bucket is
            // private,
            // but we use presigned URLs for access later)
            String s3Url = s3Client.getUrl(bucketName, s3Path).toString();

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
            file.setFilePath(s3Url); // Storing the S3 Object URL
            file.setFileType(multipartFile.getContentType());
            file.setFileSize(multipartFile.getSize());
            file.setUser(user);
            file.setFolder(folder);
            file.setLastOpenedAt(LocalDateTime.now());

            return fileRepository.save(file);

        } catch (Exception e) {
            log.error("AWS S3 upload error: {}", e.getMessage());
            throw new RuntimeException("Could not upload to S3: " + e.getMessage());
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

        if (file.getUser().getId().toString().equals(user.getId().toString())) {
            file.setIsTrashed(true);
            fileRepository.save(file);
            return;
        }

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

        if (file.getUser().getId().toString().equals(user.getId().toString())) {
            file.setIsStarred(file.getIsStarred() == null ? true : !file.getIsStarred());
            return fileRepository.save(file);
        }

        com.cloudstorage.model.Share share = shareRepository.findByFileIdAndSharedWith(fileId, user)
                .orElseThrow(() -> new RuntimeException("Access denied: You don't have permission to star this file."));

        share.setIsStarred(share.getIsStarred() == null ? true : !share.getIsStarred());
        return shareRepository.save(share);
    }

    public void permanentDeleteFile(UUID fileId, User user) {
        File file = getFile(fileId, user);

        // Delete from S3
        try {
            String path = file.getFilePath();
            // Extract key from URL: s3-endpoint/bucket/user-id/filename
            // or simply use the fact that our key is user-id/filename
            String key = file.getUser().getId() + "/" + path.substring(path.lastIndexOf("/") + 1);

            log.info("Deleting from S3: {}/{}", bucketName, key);
            s3Client.deleteObject(bucketName, key);
        } catch (Exception e) {
            log.warn("Could not delete from S3: {}", e.getMessage());
        }

        fileRepository.delete(file);
    }

    public List<File> searchFiles(User user, String query) {
        return fileRepository.findByUserAndFileNameContainingIgnoreCaseAndIsTrashedFalse(user, query);
    }

    public List<File> getRecentFiles(User user) {
        List<File> ownedFiles = fileRepository.findByUserAndIsTrashedFalse(user);
        List<com.cloudstorage.model.Share> sharedWithMe = shareRepository.findBySharedWith(user);
        List<File> sharedFiles = sharedWithMe.stream()
                .map(com.cloudstorage.model.Share::getFile)
                .filter(f -> !f.getIsTrashed())
                .toList();

        java.util.List<File> combined = new java.util.ArrayList<>();
        combined.addAll(ownedFiles);
        combined.addAll(sharedFiles);

        return combined.stream()
                .sorted((f1, f2) -> {
                    LocalDateTime t1 = f1.getLastOpenedAt() != null ? f1.getLastOpenedAt() : f1.getCreatedAt();
                    LocalDateTime t2 = f2.getLastOpenedAt() != null ? f2.getLastOpenedAt() : f2.getCreatedAt();
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
                    file.setLastOpenedAt(LocalDateTime.now());
                    fileRepository.save(file);
                });
            }
        } catch (Exception e) {
            log.warn("Failed to report file open: {}", e.getMessage());
        }
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
            return;

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
            String path = file.getFilePath();
            // In S3, the key is what we need. For our app, it's user-id/unique-filename
            // Since we store the full URL, we extract the part after the bucket name
            String key = file.getUser().getId() + "/" + path.substring(path.lastIndexOf("/") + 1);

            // Set expiration to 2 hours
            Date expiration = new Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * 60 * 2; // 2 hours
            expiration.setTime(expTimeMillis);

            log.info("Generating presigned URL for S3 key: {}", key);
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucketName, key)
                    .withMethod(HttpMethod.GET)
                    .withExpiration(expiration);

            URL url = s3Client.generatePresignedUrl(request);
            return url.toString();
        } catch (Exception e) {
            log.error("Failed to generate S3 presigned URL: {}", e.getMessage());
            return file.getFilePath();
        }
    }
}
