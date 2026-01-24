package com.cloudstorage.repository;

import com.cloudstorage.model.Share;
import com.cloudstorage.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {

    // Find shares where file is shared WITH this user
    List<Share> findBySharedWith(User user);

    // Find shares created BY this user
    List<Share> findBySharedBy(User user);

    // Find specific share
    Optional<Share> findByFileIdAndSharedWith(UUID fileId, User sharedWith);

    // Check if user has access to file
    boolean existsByFileIdAndSharedWith(UUID fileId, User sharedWith);

    // Find all shares for a specific file
    List<Share> findByFileId(UUID fileId);
}
