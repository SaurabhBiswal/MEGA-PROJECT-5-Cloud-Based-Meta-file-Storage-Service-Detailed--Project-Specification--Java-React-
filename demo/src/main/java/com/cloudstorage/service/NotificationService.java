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
            String permission) {
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

        // 2. Send Real Email
        String body = String.format(
                """
                        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
                            <h2 style="color: #4f46e5;">New File Shared!</h2>
                            <p><b>%s</b> has shared a file with you on CloudBox.</p>
                            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                <p><b>File:</b> %s</p>
                                <p><b>Permission:</b> %s</p>
                            </div>
                            <a href="%s/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View in Dashboard</a>
                        </div>
                        """,
                sharerName, file.getFileName(), permission.equals("VIEWER") ? "Can view" : "Can edit", frontendUrl);

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

        // Send Email (External users don't have DB accounts yet)
        String body = String.format(
                """
                        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
                            <h2 style="color: #4f46e5;">File Invitation</h2>
                            <p><b>%s</b> invited you to view a file on CloudBox.</p>
                            <p>Since you don't have an account, you can access it directly via this secure link:</p>
                            <div style="margin: 30px 0;">
                                <a href="%s/public-view/%s" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Private Link</a>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                            <p style="font-size: 12px; color: #64748b;">Want your own secure storage? <a href="%s/signup">Sign up for CloudBox</a></p>
                        </div>
                        """,
                sharerName, frontendUrl, publicToken, frontendUrl);

        emailService.sendEmail(email, subject, body, sharerName, sharedBy.getEmail());
        log.info("External notification transmitted to Gmail for {}", email);
    }
}
