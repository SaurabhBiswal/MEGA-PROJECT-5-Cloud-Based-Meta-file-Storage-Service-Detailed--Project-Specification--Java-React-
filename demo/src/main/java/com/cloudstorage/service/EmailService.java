package com.cloudstorage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${sendgrid.api.key:placeholder}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email:punpunsaurabh2002@gmail.com}")
    private String fromEmail;

    private final RestTemplate restTemplate;

    @Async
    public void sendEmail(String to, String subject, String body, String fromName, String replyToEmail) {
        if (sendGridApiKey == null || sendGridApiKey.equals("placeholder") || sendGridApiKey.contains("${")) {
            log.error(
                    "❌ CRITICAL: SendGrid API Key is MISSING or INVALID. Cannot send email to {}. Please set SENDGRID_API_KEY environment variable.",
                    to);
            return;
        }

        log.info("Preparing to send email to: {} from: {} via SendGrid", to, fromName);

        try {
            String url = "https://api.sendgrid.com/v3/mail/send";

            // Build SendGrid Request Structure
            Map<String, Object> requestBody = new HashMap<>();

            // Personalizations
            Map<String, Object> personalization = new HashMap<>();
            personalization.put("to", List.of(Map.of("email", to)));
            personalization.put("subject", subject);
            requestBody.put("personalizations", List.of(personalization));

            // From
            requestBody.put("from", Map.of("email", fromEmail, "name", fromName != null ? fromName : "CloudBox"));

            // Content
            requestBody.put("content", List.of(Map.of("type", "text/html", "value", body)));

            if (replyToEmail != null) {
                requestBody.put("reply_to", Map.of("email", replyToEmail));
            }

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + sendGridApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Attempting SendGrid API call for {}", to);
            // SendGrid returns 202 Accepted on success
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Email sent successfully via SendGrid to: {}", to);
            } else {
                log.error("❌ SendGrid API returned status: {} body: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("❌ Email delivery failed for SendGrid {}: {}", to, e.getMessage());
        }
    }
}
