package com.samagri;

import com.samagri.dto.RecommendationRequest;
import com.samagri.dto.RecommendationResultDto;
import com.samagri.service.CropRecommendationService;
import com.samagri.service.IrrigationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class SmartAgricultureApplicationTests {

    @Autowired
    private IrrigationService irrigationService;

    @Autowired
    private CropRecommendationService recommendationService;

    @Test
    @DisplayName("Context loads successfully")
    void contextLoads() {
        assertNotNull(irrigationService);
        assertNotNull(recommendationService);
    }

    @Test
    @DisplayName("Irrigation rule: 25% soil moisture requires irrigation")
    void testIrrigationRuleBelowThirty() {
        String status = irrigationService.evaluateIrrigationStatus(25.0);
        assertEquals(IrrigationService.STATUS_IRRIGATION_REQUIRED, status);

        String status29 = irrigationService.evaluateIrrigationStatus(29.9);
        assertEquals(IrrigationService.STATUS_IRRIGATION_REQUIRED, status29);
    }

    @Test
    @DisplayName("Irrigation rule: 30% and 45% soil moisture are normal")
    void testIrrigationRuleThirtyAndAbove() {
        String status30 = irrigationService.evaluateIrrigationStatus(30.0);
        assertEquals(IrrigationService.STATUS_MOISTURE_NORMAL, status30);

        String status45 = irrigationService.evaluateIrrigationStatus(45.0);
        assertEquals(IrrigationService.STATUS_MOISTURE_NORMAL, status45);
    }

    @Test
    @DisplayName("Crop recommendation rule evaluates conditions and returns ranked results")
    void testCropRecommendationRules() {
        RecommendationRequest request = new RecommendationRequest(
                null,
                29.0, // Temp
                70.0, // Humidity
                60.0, // Moisture
                "Loamy" // Soil Type
        );

        List<RecommendationResultDto> recommendations = recommendationService.getRecommendations(request);
        assertNotNull(recommendations);
        assertFalse(recommendations.isEmpty());

        RecommendationResultDto topRecommendation = recommendations.get(0);
        assertTrue(topRecommendation.getSuitabilityScore() >= 50);
        assertNotNull(topRecommendation.getReason());
        assertTrue(topRecommendation.getReason().length() > 10);
    }
}
