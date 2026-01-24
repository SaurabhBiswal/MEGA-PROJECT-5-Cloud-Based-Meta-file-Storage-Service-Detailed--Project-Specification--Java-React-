package com.cloudstorage.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String smtpUsername;

    public void sendEmail(String to, String subject, String body, String fromName, String replyToEmail) {
        log.info("Preparing to send email to: {} from: {} via SMTP", to, fromName);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderDisplay = (fromName != null) ? fromName + " via CloudBox" : "CloudBox";
            // Reverting to simple string format for maximum Gmail compatibility
            helper.setFrom(senderDisplay + " <" + smtpUsername + ">");
            helper.setReplyTo(replyToEmail != null ? replyToEmail : "noreply@cloudbox.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            log.info("Attempting SMTP handshake for {}", to);
            mailSender.send(message);
            log.info("SMTP SUCCESS: Message delivered to mail server for carrier: {}", to);
        } catch (Exception e) {
            log.error("SMTP CRITICAL FAILURE: Failed to transmit to {}. Internal Error: {}", to, e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Email delivery failed: " + e.getMessage());
        }
    }
}
