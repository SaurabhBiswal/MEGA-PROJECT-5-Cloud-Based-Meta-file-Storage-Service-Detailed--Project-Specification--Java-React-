package com.cloudstorage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
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
}