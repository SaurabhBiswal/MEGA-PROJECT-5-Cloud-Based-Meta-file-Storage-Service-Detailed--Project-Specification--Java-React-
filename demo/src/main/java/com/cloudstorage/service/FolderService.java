package com.cloudstorage.service;

import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;

    // Create folder
    public Folder createFolder(String name, User user, UUID parentFolderId) {
        Folder folder = new Folder();
        folder.setName(name);
        folder.setUser(user);

        if (parentFolderId != null) {
            Folder parentFolder = folderRepository.findById(parentFolderId)
                    .orElseThrow(() -> new RuntimeException("Parent folder not found"));

            // Verify parent folder belongs to user
            if (!parentFolder.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("You don't have access to this folder");
            }

            folder.setParentFolder(parentFolder);
        }

        return folderRepository.save(folder);
    }

    // Get user's folders
    public List<Folder> getUserFolders(User user) {
        return folderRepository.findByUserAndIsTrashedFalse(user);
    }

    // Get root folders (no parent)
    public List<Folder> getRootFolders(User user) {
        return folderRepository.findByUserAndParentFolderIsNullAndIsTrashedFalse(user);
    }

    // Get subfolders
    public List<Folder> getSubfolders(User user, UUID parentFolderId) {
        return folderRepository.findByUserAndParentFolderIdAndIsTrashedFalse(user, parentFolderId);
    }

    // Get folder by ID
    public Folder getFolder(UUID folderId, User user) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        // Verify user owns the folder
        if (!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You don't have access to this folder");
        }

        return folder;
    }

    // Delete folder (soft delete)
    public void deleteFolder(UUID folderId, User user) {
        Folder folder = getFolder(folderId, user);
        folder.setIsTrashed(true);
        folderRepository.save(folder);
    }

    // Restore folder
    public void restoreFolder(UUID folderId, User user) {
        Folder folder = getFolder(folderId, user);
        folder.setIsTrashed(false);
        folderRepository.save(folder);
    }

    // Permanent delete
    public void permanentDeleteFolder(UUID folderId, User user) {
        Folder folder = getFolder(folderId, user);
        folderRepository.delete(folder);
    }

    // Rename folder
    public Folder renameFolder(UUID folderId, String newName, User user) {
        Folder folder = getFolder(folderId, user);
        folder.setName(newName);
        return folderRepository.save(folder);
    }

    // Move folder
    public Folder moveFolder(UUID folderId, UUID targetFolderId, User user) {
        Folder folder = getFolder(folderId, user);

        // Prevent moving folder into itself
        if (folder.getId().equals(targetFolderId)) {
            throw new RuntimeException("Cannot move a folder into itself");
        }

        if (targetFolderId != null) {
            Folder targetFolder = folderRepository.findById(targetFolderId)
                    .orElseThrow(() -> new RuntimeException("Target folder not found"));

            if (!targetFolder.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("You don't have access to the target folder");
            }

            // Check for circular dependency (simplified check)
            // In production, we should robustly check if target folder is a child of source
            // folder

            folder.setParentFolder(targetFolder);
        } else {
            // Move to root
            folder.setParentFolder(null);
        }

        return folderRepository.save(folder);
    }
}
