package com.samagri;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samagri.dto.AuthRequest;
import com.samagri.dto.MonitoringRequest;
import com.samagri.dto.RecommendationRequest;
import com.samagri.dto.RegisterRequest;
import com.samagri.model.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class ApiControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("API Test 1: User Login returns JWT token and user info")
    void testLoginSuccess() throws Exception {
        AuthRequest loginRequest = new AuthRequest("farmer@sams.com", "farmer123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("farmer@sams.com"))
                .andExpect(jsonPath("$.data.role").value("FARMER"));
    }

    @Test
    @DisplayName("API Test 2: Invalid login credentials returns 401 Unauthorized")
    void testLoginInvalidCredentials() throws Exception {
        AuthRequest loginRequest = new AuthRequest("farmer@sams.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("API Test 3: Duplicate email registration returns 409 Conflict")
    void testDuplicateRegistration() throws Exception {
        RegisterRequest req = new RegisterRequest("Existing", "farmer@sams.com", "1234567890", "password123", Role.FARMER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("API Test 4: Farmer token cannot access Admin endpoint (403 Forbidden)")
    void testRoleBasedAccessControl() throws Exception {
        // 1. Login as Farmer
        AuthRequest farmerLogin = new AuthRequest("farmer@sams.com", "farmer123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerLogin)))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String farmerToken = objectMapper.readTree(responseBody).get("data").get("token").asText();

        // 2. Try accessing /api/admin/stats with farmer token
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("API Test 5: Post monitoring data with soil moisture 25% generates 'Irrigation Required' and alert")
    void testMonitoringEvaluationBelowThreshold() throws Exception {
        // 1. Login as Farmer
        AuthRequest farmerLogin = new AuthRequest("farmer@sams.com", "farmer123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerLogin)))
                .andReturn();
        String farmerToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data").get("token").asText();

        // 2. Submit reading with 25% moisture
        MonitoringRequest reading = new MonitoringRequest(1L, 33.0, 50.0, 25.0, null);

        mockMvc.perform(post("/api/monitoring")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reading)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.soilMoisture").value(25.0))
                .andExpect(jsonPath("$.data.irrigationStatus").value("Irrigation Required"))
                .andExpect(jsonPath("$.data.alertGenerated").value(true));
    }

    @Test
    @DisplayName("API Test 6: Crop recommendations endpoint returns ranked crops with suitability scores")
    void testCropRecommendationEndpoint() throws Exception {
        // Login as Farmer
        AuthRequest farmerLogin = new AuthRequest("farmer@sams.com", "farmer123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerLogin)))
                .andReturn();
        String farmerToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data").get("token").asText();

        RecommendationRequest req = new RecommendationRequest(null, 28.0, 65.0, 45.0, "Loamy");

        mockMvc.perform(post("/api/recommendations")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].suitabilityScore", greaterThan(0)))
                .andExpect(jsonPath("$.data[0].reason").isNotEmpty());
    }
}
