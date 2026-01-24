package com.cloudstorage.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "files", indexes = {
        @Index(name = "idx_file_user", columnList = "user_id"),
        @Index(name = "idx_file_name", columnList = "fileName"),
        @Index(name = "idx_file_type", columnList = "fileType"),
        @Index(name = "idx_file_created_at", columnList = "created_at")
})
@Data
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath; // Local storage path or S3 URL

    private String fileType; // MIME type: image/png, application/pdf, etc.

    private Long fileSize; // Size in bytes

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // File owner

    @ManyToOne
    @JoinColumn(name = "folder_id")
    private Folder folder; // Parent folder (null if in root)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_trashed")
    private Boolean isTrashed = false;

    @Column(name = "is_starred")
    private Boolean isStarred = false;

    @Column(name = "public_share_token", unique = true)
    private String publicShareToken;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
