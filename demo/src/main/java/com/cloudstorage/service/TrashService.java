package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrashService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    // Get all trashed items
    public TrashResponse getTrash(User user) {
        List<File> trashedFiles = fileRepository.findByUserAndIsTrashedTrue(user);
        List<Folder> trashedFolders = folderRepository.findByUserAndIsTrashedTrue(user);

        return new TrashResponse(trashedFiles, trashedFolders);
    }

    // Restore file from trash
    public void restoreFile(java.util.UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied");
        }

        if (!file.getIsTrashed()) {
            throw new RuntimeException("File is not in trash");
        }

        file.setIsTrashed(false);
        fileRepository.save(file);
    }

    // Restore folder from trash
    public void restoreFolder(java.util.UUID folderId, User user) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied");
        }

        if (!folder.getIsTrashed()) {
            throw new RuntimeException("Folder is not in trash");
        }

        folder.setIsTrashed(false);
        folderRepository.save(folder);
    }

    // Permanently delete file
    public void permanentDeleteFile(java.util.UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied");
        }

        // Delete physical file
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(file.getFilePath());
            java.nio.file.Files.deleteIfExists(filePath);
        } catch (java.io.IOException e) {
            System.err.println("Could not delete physical file: " + e.getMessage());
        }

        fileRepository.delete(file);
    }

    // Permanently delete folder
    public void permanentDeleteFolder(java.util.UUID folderId, User user) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied");
        }

        folderRepository.delete(folder);
    }

    // Empty entire trash
    public void emptyTrash(User user) {
        List<File> trashedFiles = fileRepository.findByUserAndIsTrashedTrue(user);
        List<Folder> trashedFolders = folderRepository.findByUserAndIsTrashedTrue(user);

        // Delete all files
        for (File file : trashedFiles) {
            permanentDeleteFile(file.getId(), user);
        }

        // Delete all folders
        for (Folder folder : trashedFolders) {
            permanentDeleteFolder(folder.getId(), user);
        }
    }
}

// Response DTO
record TrashResponse(List<File> files, List<Folder> folders) {
}
