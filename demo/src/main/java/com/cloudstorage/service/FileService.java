package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FolderRepository;
import com.cloudstorage.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final ShareRepository shareRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // Initialize upload directory
    private void initUploadDir() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    // Upload file
    public File uploadFile(MultipartFile multipartFile, User user, UUID folderId) {
        try {
            initUploadDir();

            // Validate file
            if (multipartFile.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            // Get original filename
            String originalFilename = multipartFile.getOriginalFilename();
            if (originalFilename == null) {
                throw new RuntimeException("Invalid filename");
            }

            // Generate unique filename
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Save file to disk
            Path filePath = Paths.get(uploadDir, uniqueFileName).toAbsolutePath().normalize();
            Files.copy(multipartFile.getInputStream(), filePath);

            // Get folder if specified
            Folder folder = null;
            if (folderId != null) {
                folder = folderRepository.findById(folderId)
                        .orElseThrow(() -> new RuntimeException("Folder not found"));

                // Verify folder belongs to user
                if (!folder.getUser().getId().equals(user.getId())) {
                    throw new RuntimeException("You don't have access to this folder");
                }
            }

            // Create file metadata
            File file = new File();
            file.setFileName(originalFilename);
            file.setFilePath(filePath.toString());
            file.setFileType(multipartFile.getContentType());
            file.setFileSize(multipartFile.getSize());
            file.setUser(user);
            file.setFolder(folder);

            return fileRepository.save(file);

        } catch (IOException e) {
            throw new RuntimeException("Could not save file: " + e.getMessage());
        }
    }

    // Get user's files
    public List<File> getUserFiles(User user) {
        return fileRepository.findByUserAndIsTrashedFalse(user);
    }

    // Get files in specific folder
    public List<File> getFilesInFolder(User user, UUID folderId) {
        if (folderId == null) {
            return fileRepository.findByUserAndFolderIsNullAndIsTrashedFalse(user);
        }
        return fileRepository.findByUserAndFolderIdAndIsTrashedFalse(user, folderId);
    }

    // Get file by ID
    public File getFile(UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Verify user owns the file OR has shared access
        boolean isOwner = file.getUser().getId().equals(user.getId());
        boolean isShared = shareRepository.existsByFileIdAndSharedWith(fileId, user);

        if (!isOwner && !isShared) {
            throw new RuntimeException("You don't have access to this file");
        }

        return file;
    }

    // Delete file (soft delete - move to trash)
    public void deleteFile(UUID fileId, User user) {
        File file = getFile(fileId, user);
        file.setIsTrashed(true);
        fileRepository.save(file);
    }

    // Restore file from trash
    public void restoreFile(UUID fileId, User user) {
        File file = getFile(fileId, user);
        file.setIsTrashed(false);
        fileRepository.save(file);
    }

    // Get trashed files
    public List<File> getTrashedFiles(User user) {
        return fileRepository.findByUserAndIsTrashedTrue(user);
    }

    // Get starred files
    public List<File> getStarredFiles(User user) {
        return fileRepository.findByUserAndIsStarredTrueAndIsTrashedFalse(user);
    }

    // Toggle star status
    public File toggleStar(UUID fileId, User user) {
        File file = getFile(fileId, user);
        // Map null to false if needed, or assume default is false
        file.setIsStarred(file.getIsStarred() == null ? true : !file.getIsStarred());
        return fileRepository.save(file);
    }

    // Permanent delete
    public void permanentDeleteFile(UUID fileId, User user) {
        File file = getFile(fileId, user);

        // Delete physical file
        try {
            Path filePath = Paths.get(file.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log error but continue with database deletion
            System.err.println("Could not delete physical file: " + e.getMessage());
        }

        // Delete from database
        fileRepository.delete(file);
    }

    // Search files
    public List<File> searchFiles(User user, String query) {
        return fileRepository.findByUserAndFileNameContainingIgnoreCaseAndIsTrashedFalse(user, query);
    }

    // Advanced Search
    public List<File> advancedSearchFiles(User user, String query, String fileType, Long minSize, Long maxSize,
            LocalDateTime startDate, LocalDateTime endDate) {
        org.springframework.data.jpa.domain.Specification<File> spec = org.springframework.data.jpa.domain.Specification
                .where(com.cloudstorage.repository.FileSpecification.hasUser(user))
                .and(com.cloudstorage.repository.FileSpecification.isNotTrashed())
                .and(com.cloudstorage.repository.FileSpecification.nameContains(query))
                .and(com.cloudstorage.repository.FileSpecification.hasFileType(fileType))
                .and(com.cloudstorage.repository.FileSpecification.hasSizeGreaterThan(minSize))
                .and(com.cloudstorage.repository.FileSpecification.hasSizeLessThan(maxSize))
                .and(com.cloudstorage.repository.FileSpecification.createdAfter(startDate))
                .and(com.cloudstorage.repository.FileSpecification.createdBefore(endDate));

        return fileRepository.findAll(spec);
    }

    // Rename file
    public File renameFile(UUID fileId, String newName, User user) {
        File file = getFile(fileId, user);
        file.setFileName(newName);
        return fileRepository.save(file);
    }

    // Move file
    public File moveFile(UUID fileId, UUID targetFolderId, User user) {
        File file = getFile(fileId, user);

        if (targetFolderId != null) {
            Folder targetFolder = folderRepository.findById(targetFolderId)
                    .orElseThrow(() -> new RuntimeException("Target folder not found"));

            if (!targetFolder.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("You don't have access to the target folder");
            }
            file.setFolder(targetFolder);
        } else {
            // Move to root
            file.setFolder(null);
        }

        return fileRepository.save(file);
    }

    // Calculate total storage used by user
    public long calculateUserStorage(User user) {
        List<File> userFiles = fileRepository.findByUserAndIsTrashedFalse(user);
        return userFiles.stream()
                .mapToLong(File::getFileSize)
                .sum();
    }

    // Generate public link
    public String generatePublicLink(UUID fileId, User user) {
        File file = getFile(fileId, user);
        if (file.getPublicShareToken() == null) {
            file.setPublicShareToken(UUID.randomUUID().toString());
            fileRepository.save(file);
        }
        return file.getPublicShareToken();
    }

    // Revoke public link
    public void revokePublicLink(UUID fileId, User user) {
        File file = getFile(fileId, user);
        file.setPublicShareToken(null);
        fileRepository.save(file);
    }

    // Get file by public token (unauthenticated)
    public File getFileByPublicToken(String token) {
        return fileRepository.findByPublicShareToken(token)
                .orElseThrow(() -> new RuntimeException("Link invalid or expired"));
    }
}
