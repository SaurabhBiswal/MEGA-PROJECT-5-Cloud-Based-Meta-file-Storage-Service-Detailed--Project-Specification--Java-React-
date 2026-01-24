package com.cloudstorage.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Recipient

    private String title;
    private String message;
    private String type; // SHARE, SYSTEM, ALERT

    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String actionLink; // e.g. /dashboard or /shared
}
