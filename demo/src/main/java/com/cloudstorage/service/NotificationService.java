package com.cloudstorage.service;

import com.cloudstorage.model.File;
import com.cloudstorage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;
    private final com.cloudstorage.repository.NotificationRepository notificationRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Send notification when a file is shared
     */
    public void sendFileSharedNotification(User sharedWith, User sharedBy, com.cloudstorage.model.File file,
            String permission, String publicToken) {
        String sharerName = sharedBy.getName() != null ? sharedBy.getName() : sharedBy.getEmail();
        String subject = String.format("%s shared a file with you", sharerName);

        // 1. Create DB Notification
        com.cloudstorage.model.Notification notification = new com.cloudstorage.model.Notification();
        notification.setUser(sharedWith);
        notification.setTitle("New file shared");
        notification.setMessage(String.format("%s shared \"%s\" with you.", sharerName, file.getFileName()));
        notification.setType("SHARE");
        notification.setActionLink("/shared");
        notificationRepository.save(notification);

        // 2. Send Real Email (SIMPLIFIED TEMPLATE)
        String body = String.format(
                """
                        <h3>New File Shared with you!</h3>
                        <p><b>%s</b> has shared "<b>%s</b>" with you on CloudBox.</p>
                        <p>Permission: <b>%s</b></p>
                        <div style="margin-top: 20px;">
                            <a href="%s/public-view/%s" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View File</a>
                        </div>
                        """,
                sharerName, file.getFileName(), permission.equals("VIEWER") ? "Can view" : "Can edit", frontendUrl,
                publicToken);

        emailService.sendEmail(sharedWith.getEmail(), subject, body, sharerName, sharedBy.getEmail());
        log.info("Shared notification saved and emailed for {}", sharedWith.getEmail());
    }

    /**
     * Send notification to an external email address
     */
    public void sendExternalShareNotification(String email, User sharedBy, com.cloudstorage.model.File file,
            String publicToken) {
        String sharerName = sharedBy.getName() != null ? sharedBy.getName() : sharedBy.getEmail();
        String subject = String.format("%s invited you to view a file", sharerName);

        // Send Email (SIMPLIFIED TEMPLATE)
        String body = String.format(
                """
                        <h3>File Invitation from %s</h3>
                        <p>You have been invited to view a file on CloudBox.</p>
                        <p>Access it safely using this link:</p>
                        <div style="margin-top: 20px;">
                            <a href="%s/public-view/%s" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View File</a>
                        </div>
                        """,
                sharerName, frontendUrl, publicToken);

        emailService.sendEmail(email, subject, body, sharerName, sharedBy.getEmail());
        log.info("External notification transmitted to Gmail for {}", email);
    }
}
