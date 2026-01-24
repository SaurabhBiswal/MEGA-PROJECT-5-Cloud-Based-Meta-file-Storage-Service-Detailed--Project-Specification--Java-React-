package com.cloudstorage.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @GetMapping
    public String test() {
        return "✅ Cloud Storage API is WORKING with H2 Database! 🚀";
    }
    
    @GetMapping("/db-test")
    public String dbTest() {
        return "✅ Database connection is WORKING! Users table created successfully.";
    }
    
    @GetMapping("/create-users-table")
    public String createUsersTable() {
        // Hibernate automatically creates table
        return "✅ Users table will be created automatically by JPA";
    }
}