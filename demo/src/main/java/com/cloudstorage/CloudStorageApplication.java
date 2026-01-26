package com.cloudstorage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableAsync
public class CloudStorageApplication {
    public static void main(String[] args) {
        SpringApplication.run(CloudStorageApplication.class, args);
        System.out.println("✅ Cloud Storage Application Started!");
        System.out.println("✅ Connected to H2 In-Memory Database");
        System.out.println("✅ Server running on http://localhost:8080");
        System.out.println("✅ H2 Console available at http://localhost:8080/h2-console");
        System.out.println("✅ Test APIs:");
        System.out.println("   - http://localhost:8080/api/test");
        System.out.println("   - http://localhost:8080/api/db-test");
        System.out.println("   - http://localhost:8080/api/create-users-table");
    }

    @Bean
    public RestTemplate restTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setBufferRequestBody(false);
        // Increase timeout to 30 minutes for large file uploads (2GB)
        factory.setConnectTimeout(1800000);
        factory.setReadTimeout(1800000);
        return new RestTemplate(factory);
    }
}