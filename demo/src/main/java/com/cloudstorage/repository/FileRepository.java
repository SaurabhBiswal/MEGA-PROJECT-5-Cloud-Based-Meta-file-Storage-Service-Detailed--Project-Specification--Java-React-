package com.cloudstorage.repository;

import com.cloudstorage.model.File;
import com.cloudstorage.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<File, UUID>, JpaSpecificationExecutor<File> {

    // Find all files by user (not in trash)
    List<File> findByUserAndIsTrashedFalse(User user);

    // Find all trashed files by user
    List<File> findByUserAndIsTrashedTrue(User user);

    // Find files by user and folder
    List<File> findByUserAndFolderIdAndIsTrashedFalse(User user, UUID folderId);

    // Find files in root (no folder)
    List<File> findByUserAndFolderIsNullAndIsTrashedFalse(User user);

    // Search files by name
    List<File> findByUserAndFileNameContainingIgnoreCaseAndIsTrashedFalse(User user, String fileName);

    Optional<File> findByPublicShareToken(String token);

    // Find starred files
    List<File> findByUserAndIsStarredTrueAndIsTrashedFalse(User user);

    // Find recent files
    List<File> findTop20ByUserAndIsTrashedFalseOrderByCreatedAtDesc(User user);
}
