package com.cloudstorage.repository;

import com.cloudstorage.model.Folder;
import com.cloudstorage.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {

    // Find all folders by user (not in trash)
    List<Folder> findByUserAndIsTrashedFalse(User user);

    // Find all trashed folders by user
    List<Folder> findByUserAndIsTrashedTrue(User user);

    // Find root folders (no parent)
    List<Folder> findByUserAndParentFolderIsNullAndIsTrashedFalse(User user);

    // Find subfolders of a parent folder
    List<Folder> findByUserAndParentFolderIdAndIsTrashedFalse(User user, UUID parentFolderId);
}
