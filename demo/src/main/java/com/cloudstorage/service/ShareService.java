package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.Share;
import com.cloudstorage.model.User;
import com.cloudstorage.repository.FileRepository;
import com.cloudstorage.repository.ShareRepository;
import com.cloudstorage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShareService {

    private final ShareRepository shareRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // Share file with user
    /**
     * Shares a file via internal system user or generates a public external token.
     *
     * @param fileId     The ID of the file to share
     * @param email      The recipient's email address
     * @param permission The access level (VIEWER/EDITOR)
     * @param sharedBy   The user initiating the share
     * @return A map (external share) or the created Share entity
     */
    public Object shareFile(UUID fileId, String email, Share.Permission permission, User sharedBy) {
        // Find file
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Check permission (only owner can share for now)
        if (!file.getUser().getId().toString().equals(sharedBy.getId().toString())) {
            throw new RuntimeException("You don't have permission to share this file");
        }

        // ALWAYS ensure public link exists for direct access via email (Unification)
        if (file.getPublicShareToken() == null) {
            file.setPublicShareToken(UUID.randomUUID().toString());
            file = fileRepository.saveAndFlush(file);
        }

        // Find user to share with
        Optional<User> sharedWithOpt = userRepository.findByEmail(email);

        if (sharedWithOpt.isEmpty()) {
            // EXTERNAL SHARE: User not in system
            try {
                notificationService.sendExternalShareNotification(email, sharedBy, file, file.getPublicShareToken());
            } catch (Exception e) {
                log.error("⚠️ EXTERNAL EMAIL FAILED: {}", e.getMessage());
            }
            return Map.of("external", true, "token", file.getPublicShareToken());
        }

        User sharedWith = sharedWithOpt.get();

        if (sharedWith.getId().toString().equals(sharedBy.getId().toString())) {
            throw new RuntimeException("You cannot share file with yourself");
        }

        // Check if already shared
        Optional<Share> existingShare = shareRepository.findByFileIdAndSharedWith(fileId, sharedWith);
        if (existingShare.isPresent()) {
            Share share = existingShare.get();
            share.setPermission(permission);
            return shareRepository.save(share);
        }

        Share share = new Share();
        share.setFile(file);
        share.setSharedBy(sharedBy);
        share.setSharedWith(sharedWith);
        share.setPermission(permission);

        Share savedShare = shareRepository.save(share);

        // Send Notification with the direct public token
        try {
            notificationService.sendFileSharedNotification(sharedWith, sharedBy, file, permission.name(),
                    file.getPublicShareToken());
        } catch (Exception e) {
            log.error("⚠️ INTERNAL EMAIL FAILED: {}", e.getMessage());
        }

        return savedShare;
    }

    // Revoke share
    /**
     * Revokes a previously granted file share.
     * 
     * @param shareId The ID of the permission record
     * @param user    The user requesting revocation (must be owner or recipient)
     */
    public void revokeShare(UUID shareId, User user) {
        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share not found"));

        // Only owner or the person it was shared with can remove
        if (!share.getSharedBy().getId().toString().equals(user.getId().toString()) &&
                !share.getSharedWith().getId().toString().equals(user.getId().toString())) {
            throw new RuntimeException("Permission denied");
        }

        shareRepository.delete(share);
    }

    // Get files shared with me
    public List<Share> getSharedWithMe(User user) {
        return shareRepository.findBySharedWith(user);
    }

    // Get files shared by me
    public List<Share> getSharedByMe(User user) {
        return shareRepository.findBySharedBy(user);
    }

    // Get shares for a specific file
    public List<Share> getFileShares(UUID fileId, User user) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Check if user owns the file
        if (!file.getUser().getId().toString().equals(user.getId().toString())) {
            throw new RuntimeException("You don't have permission to view shares for this file");
        }

        return shareRepository.findByFileId(fileId);
    }
}
