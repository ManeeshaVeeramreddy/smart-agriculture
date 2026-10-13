package com.samagri;

import com.samagri.dto.VoiceQueryRequest;
import com.samagri.dto.VoiceQueryResponse;
import com.samagri.model.Field;
import com.samagri.model.MonitoringData;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.AlertRepository;
import com.samagri.repository.CropRepository;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.MonitoringDataRepository;
import com.samagri.service.CropRecommendationService;
import com.samagri.service.IrrigationService;
import com.samagri.service.VoiceAssistantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class VoiceAssistantServiceTest {

    private MonitoringDataRepository monitoringDataRepository;
    private AlertRepository alertRepository;
    private FieldRepository fieldRepository;
    private CropRepository cropRepository;
    private IrrigationService irrigationService;
    private CropRecommendationService cropRecommendationService;
    private VoiceAssistantService voiceAssistantService;

    private User testUser;
    private Field testField;

    @BeforeEach
    void setUp() {
        monitoringDataRepository = Mockito.mock(MonitoringDataRepository.class);
        alertRepository = Mockito.mock(AlertRepository.class);
        fieldRepository = Mockito.mock(FieldRepository.class);
        cropRepository = Mockito.mock(CropRepository.class);
        irrigationService = Mockito.mock(IrrigationService.class);
        cropRecommendationService = Mockito.mock(CropRecommendationService.class);

        voiceAssistantService = new VoiceAssistantService(
                monitoringDataRepository,
                alertRepository,
                fieldRepository,
                cropRepository,
                irrigationService,
                cropRecommendationService
        );

        testUser = new User();
        testUser.setUserId(1L);
        testUser.setName("Farmer Ramesh");
        testUser.setEmail("ramesh@example.com");
        testUser.setRole(Role.FARMER);

        testField = new Field();
        testField.setFieldId(1L);
        testField.setFieldName("Green Acres");
        testField.setUser(testUser);
    }

    @Test
    @DisplayName("Voice query: Soil Moisture in English")
    void testSoilMoistureQueryEnglish() {
        MonitoringData data = new MonitoringData(1L, testField, 31.0, 60.0, 24.5, LocalDateTime.now());
        when(monitoringDataRepository.findFirstByFieldUserOrderByDateTimeDesc(testUser))
                .thenReturn(Optional.of(data));

        VoiceQueryRequest request = new VoiceQueryRequest("What is the soil moisture?", "en");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("CHECK_SOIL_MOISTURE", response.getIntent());
        assertTrue(response.getDisplayText().contains("24.5%"));
        assertTrue(response.getSpokenText().contains("Irrigation is required immediately"));
    }

    @Test
    @DisplayName("Voice query: Soil Moisture in Telugu (నేల తేమ ఎంత?)")
    void testSoilMoistureQueryTelugu() {
        MonitoringData data = new MonitoringData(1L, testField, 31.0, 60.0, 35.0, LocalDateTime.now());
        when(monitoringDataRepository.findFirstByFieldUserOrderByDateTimeDesc(testUser))
                .thenReturn(Optional.of(data));

        VoiceQueryRequest request = new VoiceQueryRequest("నేల తేమ ఎంత?", "te");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("CHECK_SOIL_MOISTURE", response.getIntent());
        assertTrue(response.getDisplayText().contains("35.0%"));
        assertTrue(response.getDisplayText().contains("సాధారణ"));
    }

    @Test
    @DisplayName("Voice query: Irrigation status check")
    void testIrrigationStatusQuery() {
        MonitoringData data = new MonitoringData(1L, testField, 30.0, 55.0, 22.0, LocalDateTime.now());
        when(monitoringDataRepository.findFirstByFieldUserOrderByDateTimeDesc(testUser))
                .thenReturn(Optional.of(data));

        VoiceQueryRequest request = new VoiceQueryRequest("Is irrigation required?", "en");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("IRRIGATION_STATUS", response.getIntent());
        assertTrue(response.getSpokenText().contains("Yes, irrigation is required"));
    }

    @Test
    @DisplayName("Voice query: Navigation to Fields")
    void testNavigationFields() {
        VoiceQueryRequest request = new VoiceQueryRequest("Go to fields", "en");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("NAVIGATE_FIELDS", response.getIntent());
        assertEquals("fields.html", response.getRedirectUrl());
        assertEquals("NAVIGATE", response.getAction());
    }

    @Test
    @DisplayName("Voice query: Navigation in Telugu (డాష్‌బోర్డ్ వెళ్ళు)")
    void testNavigationTelugu() {
        VoiceQueryRequest request = new VoiceQueryRequest("డాష్‌బోర్డ్ వెళ్ళు", "te");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("NAVIGATE_DASHBOARD", response.getIntent());
        assertEquals("farmer-dashboard.html", response.getRedirectUrl());
        assertTrue(response.getDisplayText().contains("డాష్‌బోర్డ్‌కు"));
    }

    @Test
    @DisplayName("Voice query: Active alerts check when no alerts exist")
    void testAlertsQueryEmpty() {
        when(alertRepository.findByUserOrBroadcastAndStatus(testUser, "ACTIVE"))
                .thenReturn(Collections.emptyList());

        VoiceQueryRequest request = new VoiceQueryRequest("Do I have any alerts?", "en");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("CHECK_ALERTS", response.getIntent());
        assertTrue(response.getSpokenText().contains("no active alerts"));
    }

    @Test
    @DisplayName("Voice query: Help commands")
    void testHelpQuery() {
        VoiceQueryRequest request = new VoiceQueryRequest("help me", "en");
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, testUser);

        assertNotNull(response);
        assertEquals("HELP", response.getIntent());
        assertTrue(response.getDisplayText().contains("Supported voice queries"));
    }
}
