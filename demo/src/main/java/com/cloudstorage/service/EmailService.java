package com.cloudstorage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.from.email:noreply@cloudbox.com}")
    private String fromEmail;

    private final RestTemplate restTemplate;

    @Async
    public void sendEmail(String to, String subject, String body, String fromName, String replyToEmail) {
        log.info("Preparing to send email to: {} from: {} via Resend", to, fromName);

        try {
            String url = "https://api.resend.com/emails";

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromName != null ? fromName + " <" + fromEmail + ">" : fromEmail);
            requestBody.put("to", new String[] { to });
            requestBody.put("subject", subject);
            requestBody.put("html", body);

            if (replyToEmail != null) {
                requestBody.put("reply_to", replyToEmail);
            }

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Attempting Resend API call for {}", to);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("✅ Email sent successfully via Resend to: {}", to);
            } else {
                log.error("❌ Resend API returned status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("❌ Email delivery failed for {}: {}", to, e.getMessage());
            e.printStackTrace();
        }
    }
}
