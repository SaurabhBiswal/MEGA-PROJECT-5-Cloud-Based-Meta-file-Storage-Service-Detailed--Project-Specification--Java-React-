package com.cloudstorage.controller;

import com.cloudstorage.dto.AuthRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ShareIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String ownerEmail = "owner@example.com";
    private String viewerEmail = "viewer@example.com";
    private String viewerToken;

    @BeforeEach
    public void setup() throws Exception {
        // Register Owner
        AuthRequest owner = new AuthRequest();
        owner.setEmail(ownerEmail);
        owner.setPassword("password");
        owner.setName("Owner");

        try {
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(owner)));
        } catch (Exception e) {
        }

        // Register Viewer
        AuthRequest viewer = new AuthRequest();
        viewer.setEmail(viewerEmail);
        viewer.setPassword("password");
        viewer.setName("Viewer");

        try {
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(viewer)));
        } catch (Exception e) {
        }

        // Login Viewer
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(viewer)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        java.util.Map<String, String> map = objectMapper.readValue(response, java.util.Map.class);
        viewerToken = "Bearer " + map.get("token");
    }

    @Test
    public void shouldGetSharedWithMe() throws Exception {
        mockMvc.perform(get("/api/shares/shared-with-me")
                .header("Authorization", viewerToken))
                .andExpect(status().isOk());
    }
}
