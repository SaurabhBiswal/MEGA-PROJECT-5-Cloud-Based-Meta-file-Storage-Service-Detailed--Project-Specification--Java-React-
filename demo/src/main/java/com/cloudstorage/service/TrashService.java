package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrashService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final FileService fileService;

    public TrashResponse getTrash(User user) {
        List<File> trashedFiles = fileRepository.findByUserAndIsTrashedTrue(user);
        List<Folder> trashedFolders = folderRepository.findByUserAndIsTrashedTrue(user);
        return new TrashResponse(trashedFiles, trashedFolders);
    }

    public void restoreFile(UUID fileId, User user) {
        File file = fileRepository.findById(fileId).orElseThrow(() -> new RuntimeException("File not found"));
        if (!file.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Denied");
        file.setIsTrashed(false);
        fileRepository.save(file);
    }

    public void restoreFolder(UUID folderId, User user) {
        Folder folder = folderRepository.findById(folderId).orElseThrow(() -> new RuntimeException("Folder not found"));
        if (!folder.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Denied");
        folder.setIsTrashed(false);
        folderRepository.save(folder);
    }

    public void permanentDeleteFile(UUID fileId, User user) {
        // Delegate to FileService to handle cloud deletion logic
        fileService.permanentDeleteFile(fileId, user);
    }

    public void permanentDeleteFolder(UUID folderId, User user) {
        Folder folder = folderRepository.findById(folderId).orElseThrow(() -> new RuntimeException("Folder not found"));
        if (!folder.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Denied");
        folderRepository.delete(folder);
    }

    public void emptyTrash(User user) {
        List<File> trashedFiles = fileRepository.findByUserAndIsTrashedTrue(user);
        List<Folder> trashedFolders = folderRepository.findByUserAndIsTrashedTrue(user);
        for (File file : trashedFiles)
            permanentDeleteFile(file.getId(), user);
        for (Folder folder : trashedFolders)
            permanentDeleteFolder(folder.getId(), user);
    }
}

record TrashResponse(List<File> files, List<Folder> folders) {
}
