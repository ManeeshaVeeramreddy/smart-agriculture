package com.samagri.service;

import com.samagri.dto.RecommendationRequest;
import com.samagri.dto.RecommendationResultDto;
import com.samagri.dto.VoiceQueryRequest;
import com.samagri.dto.VoiceQueryResponse;
import com.samagri.model.Alert;
import com.samagri.model.Field;
import com.samagri.model.MonitoringData;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.AlertRepository;
import com.samagri.repository.CropRepository;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.MonitoringDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class VoiceAssistantService {

    private final MonitoringDataRepository monitoringDataRepository;
    private final AlertRepository alertRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final IrrigationService irrigationService;
    private final CropRecommendationService cropRecommendationService;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public VoiceAssistantService(MonitoringDataRepository monitoringDataRepository,
                                 AlertRepository alertRepository,
                                 FieldRepository fieldRepository,
                                 CropRepository cropRepository,
                                 IrrigationService irrigationService,
                                 CropRecommendationService cropRecommendationService) {
        this.monitoringDataRepository = monitoringDataRepository;
        this.alertRepository = alertRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.irrigationService = irrigationService;
        this.cropRecommendationService = cropRecommendationService;
    }

    /**
     * Synthesizes audio stream using natural female pronunciation in Telugu (te) or English (en)
     */
    public byte[] synthesizeSpeechAudio(String text, String lang) {
        if (text == null || text.trim().isEmpty()) {
            return new byte[0];
        }
        try {
            String language = "te".equalsIgnoreCase(lang) ? "te" : "en";
            String queryText = text.trim();
            if (queryText.length() > 200) {
                queryText = queryText.substring(0, 197) + "...";
            }
            String encoded = URLEncoder.encode(queryText, StandardCharsets.UTF_8);
            String url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + language + "&q=" + encoded;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 200) {
                return response.body();
            }
        } catch (Exception e) {
            // Fallback: return empty bytes
        }
        return new byte[0];
    }

    @Transactional(readOnly = true)
    public VoiceQueryResponse processVoiceQuery(VoiceQueryRequest request, User user) {
        String rawQuery = request != null && request.getQuery() != null ? request.getQuery().trim() : "";
        String lang = (request != null && "te".equalsIgnoreCase(request.getLanguage())) ? "te" : "en";
        String normalized = rawQuery.toLowerCase(Locale.ROOT);

        // Fetch latest telemetry for user
        MonitoringData latestData = null;
        if (user.getRole() == Role.ADMINISTRATOR) {
            List<MonitoringData> allData = monitoringDataRepository.findAllByOrderByDateTimeDesc();
            if (!allData.isEmpty()) {
                latestData = allData.get(0);
            }
        } else {
            latestData = monitoringDataRepository.findFirstByFieldUserOrderByDateTimeDesc(user).orElse(null);
        }

        // Fetch active alerts
        List<Alert> activeAlerts;
        if (user.getRole() == Role.ADMINISTRATOR) {
            activeAlerts = alertRepository.findAllByOrderByCreatedDateTimeDesc().stream()
                    .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                    .toList();
        } else {
            activeAlerts = alertRepository.findByUserOrBroadcastAndStatus(user, "ACTIVE");
        }

        long fieldCount = user.getRole() == Role.ADMINISTRATOR ? fieldRepository.count() : fieldRepository.countByUser(user);
        long cropCount = user.getRole() == Role.ADMINISTRATOR ? cropRepository.count() : cropRepository.countByFieldUser(user);

        // 1. Safety & Consequential Action Modification Check (Requirement 6: Safety and Confirmation)
        if ((matchesAny(normalized, "turn on", "start", "stop", "turn off", "switch on", "switch off", "activate", "deactivate")
                && matchesAny(normalized, "pump", "motor", "irrigation", "water"))
                || matchesAny(normalized, "turn on irrigation", "start irrigation", "activate irrigation", "start pump", "turn on pump",
                "turn on motor", "start motor", "stop irrigation", "turn off pump", "turn off motor", "delete field", "delete crop",
                "remove field", "remove crop", "delete record", "update field", "మోటార్ ఆన్", "మోటార్ ఆఫ్", "పొలాన్ని తొలగించు", "మోటార్ స్టార్ట్")) {
            return handleSafetyActionQuery("IRRIGATION_CONTROL", lang);
        }

        // 2. Crop Recommendations & Suitability (e.g. "Give me crop recommendations", "What crops are suitable for my field?")
        if (matchesAny(normalized, "crop recommendation", "crop recommendations", "give me crop recommendations",
                "what crops are suitable", "crops are suitable", "suitable for my field", "suitable crop", "suitable crops",
                "which crop is suitable", "which crop", "what to grow", "what should i grow", "what to plant", "suggest crop",
                "recommend crop", "recommend crops", "best crop", "best crops",
                "సిఫార్సు", "పంట సిఫార్సు", "ఏ పంట వేయాలి", "మంచి పంట", "ఏ విత్తనాలు", "అనుకూలమైన పంటలు", "అనుకూలమైన", "అనుకూలం", "ఏ పంటలు", "పంటలు అనుకూలం", "sifarsu", "panta")) {
            return handleCropRecommendationQuery(latestData, lang);
        }

        // 3. Soil Dryness ("Is my soil too dry?")
        if (matchesAny(normalized, "too dry", "is my soil too dry", "is the soil dry", "is soil dry", "is it too dry",
                "is it dry", "soil is dry", "dry soil", "dryness", "is my field dry",
                "నేల ఎండిపోయిందా", "మట్టి ఎండిపోయిందా", "ఎండిపోయింది", "తడి లేదా", "nela endipoyinda")) {
            return handleSoilDrynessQuery(latestData, lang);
        }

        // 4. Irrigation Status & Decision ("Should I irrigate my field?", "Show my irrigation status")
        if (matchesAny(normalized, "should i irrigate", "do i need irrigation", "is irrigation needed", "is irrigation required",
                "irrigation status", "show my irrigation status", "check irrigation", "need irrigation", "irrigate", "irrigation",
                "water my field", "water the field", "water required", "need water", "motor on", "pump on",
                "నీరు పెట్టాలా", "నీళ్లు పెట్టాలా", "నీటిపారుదల స్థితి", "నీటిపారుదల అవసరమా", "నీళ్లు కావాలా", "మోటార్ వేయాలా",
                "neeti parudala", "neellu pettala", "neeru pettala")) {
            return handleIrrigationQuery(latestData, lang);
        }

        // 5. Soil Moisture Level ("What is my soil moisture level?")
        if (matchesAny(normalized, "soil moisture level", "moisture level", "soil moisture", "moisture", "water level in soil",
                "what is my soil moisture", "how is the moisture",
                "తేమ ఎంత", "నేల తేమ", "మట్టి తేమ", "భూమి తేమ", "నేలలో తడి", "nela tema", "matti tema", "tema")) {
            return handleSoilMoistureQuery(latestData, lang);
        }

        // 6. Current Temperature & Humidity ("What is the current temperature?")
        if (matchesAny(normalized, "current temperature", "temperature", "what is the temperature", "temp", "current humidity",
                "humidity", "weather", "climate",
                "ఉష్ణోగ్రత", "ప్రస్తుత ఉష్ణోగ్రత", "గాలిలో తేమ", "వాతావరణం", "ushnogratha", "vaathavaranam")) {
            return handleWeatherQuery(latestData, lang);
        }

        // 7. Active Alerts ("Are there any alerts for my farm?")
        if (matchesAny(normalized, "alerts for my farm", "are there any alerts", "any alerts", "alert", "alerts",
                "warning", "warnings", "any warning", "emergency", "danger",
                "హెచ్చరికలు ఉన్నాయా", "హెచ్చరికలు", "హెచ్చరిక", "ఏదైనా సమస్య", "ప్రమాదం", "సమస్య", "hecharikalu", "samasya")) {
            return handleAlertsQuery(activeAlerts, lang);
        }

        // 8. Farm Condition / Farm Summary ("Explain the current condition of my farm")
        if (matchesAny(normalized, "condition of my farm", "current condition of my farm", "explain the current condition",
                "farm condition", "current condition", "condition", "how is my farm", "explain my farm", "farm summary",
                "farm status", "dashboard summary", "overview", "farm overview", "overall status",
                "వ్యవసాయ పరిస్థితి", "ప్రస్తుత పరిస్థితి", "పరిస్థితి వివరించు", "పొలం పరిస్థితి", "పరిస్థితి ఎలా ఉంది", "మొత్తం పరిస్థితి", "పరిస్థితి", "సారాంశం", "saramsam", "paristhithi")) {
            return handleSummaryQuery(latestData, activeAlerts, fieldCount, cropCount, lang);
        }

        // 9. Monitoring History ("Show my monitoring history")
        if (matchesAny(normalized, "show my monitoring history", "monitoring history", "reading history", "telemetry history",
                "history of readings", "past readings", "previous readings", "view history", "history", "logs",
                "పర్యవేక్షణ చరిత్ర", "కొలతల చరిత్ర", "రీడింగ్స్ చరిత్ర", "చరిత్ర చూపించు", "చరిత్ర", "charithra")) {
            return handleMonitoringHistoryQuery(user, lang);
        }

        // 10. Explicit Page Navigation Commands
        if (matchesAny(normalized, "open dashboard", "go to dashboard", "show dashboard", "dashboard", "home", "డాష్‌బోర్డ్", "హోమ్")) {
            return buildNavigationResponse("farmer-dashboard.html", "DASHBOARD",
                    lang.equals("te") ? "డాష్‌బోర్డ్‌కు వెళ్తున్నాము." : "Navigating to your Dashboard.", lang);
        }
        if (matchesAny(normalized, "open fields", "go to fields", "show fields", "manage fields", "fields page", "fields", "పొలాల పేజీ", "పొలాలు", "polalu")) {
            return buildNavigationResponse("fields.html", "FIELDS",
                    lang.equals("te") ? "పొలాల నిర్వహణ పేజీకి వెళ్తున్నాము." : "Opening Field Management.", lang);
        }
        if (matchesAny(normalized, "open crops", "go to crops", "show crops", "manage crops", "crops page", "crops", "పంటల పేజీ", "పంటల జాబితా", "పంటల నిర్వహణ", "pantalu")) {
            return buildNavigationResponse("crops.html", "CROPS",
                    lang.equals("te") ? "పంటల నిర్వహణ పేజీకి వెళ్తున్నాము." : "Opening Crop Management.", lang);
        }
        if (matchesAny(normalized, "add monitoring", "enter reading", "record reading", "new reading", "open monitoring", "go to monitoring", "monitoring page", "రీడింగ్ నమోదు", "కొలత నమోదు")) {
            return buildNavigationResponse("monitoring.html", "MONITORING",
                    lang.equals("te") ? "పరిశీలన డేటా నమోదు పేజీకి వెళ్తున్నాము." : "Opening Field Monitoring page.", lang);
        }
        if (matchesAny(normalized, "open alerts", "go to alerts", "view alerts", "alerts page", "హెచ్చరికల పేజీ")) {
            return buildNavigationResponse("alerts.html", "ALERTS",
                    lang.equals("te") ? "హెచ్చరికల పేజీకి వెళ్తున్నాము." : "Opening Alerts & Notifications page.", lang);
        }
        if (matchesAny(normalized, "open recommendations", "go to recommendations", "recommendations page", "సిఫార్సుల పేజీ")) {
            return buildNavigationResponse("recommendation.html", "RECOMMENDATIONS",
                    lang.equals("te") ? "పంట సిఫార్సుల పేజీకి వెళ్తున్నాము." : "Opening Crop Recommendations.", lang);
        }
        if (matchesAny(normalized, "logout", "sign out", "లాగ్ అవుట్", "లాగౌట్")) {
            VoiceQueryResponse resp = new VoiceQueryResponse();
            resp.setIntent("LOGOUT");
            resp.setAction("LOGOUT");
            resp.setDisplayText(lang.equals("te") ? "ఖాతా నుండి లాగ్ అవుట్ అవుతున్నారు." : "Logging out of your account.");
            resp.setSpokenText(resp.getDisplayText());
            resp.setRedirectUrl("login.html");
            return resp;
        }

        // 11. Help / What can you do
        if (matchesAny(normalized, "help", "command", "commands", "options", "what can you do", "సహాయం", "కమాండ్లు", "ఏం చేయగలవు", "sahayam")) {
            return handleHelpQuery(lang);
        }

        // 12. Fallback / Unknown intent
        return handleUnknownQuery(rawQuery, lang);
    }

    private VoiceQueryResponse handleSafetyActionQuery(String actionType, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("ACTION_CONFIRMATION_REQUIRED");
        resp.setAction("CONFIRM_ACTION");
        resp.setRedirectUrl("fields.html");

        if (lang.equals("te")) {
            String text = "భద్రతా సూచన: స్పష్టమైన నిర్ధారణ లేకుండా వాయిస్ కమాండ్ ద్వారా మోటార్ లేదా వ్యవసాయ డేటాను మార్చలేము. దయచేసి పొలాల నిర్వహణ పేజీ నుండి నేరుగా నిర్ధారించండి.";
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = "Safety Confirmation Required: Voice commands cannot directly alter irrigation controls or delete farm records without manual confirmation. Please use the dashboard controls to confirm this action.";
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleSoilDrynessQuery(MonitoringData data, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("CHECK_SOIL_DRYNESS");
        resp.setAction("READ_DATA");
        Map<String, Object> payload = new HashMap<>();

        if (data == null || data.getSoilMoisture() == null) {
            String msgEn = "No soil moisture readings have been recorded yet. Please add a field reading from the Monitoring page to check dryness.";
            String msgTe = "ఇంతవరకు నేల తేమ కొలతలు నమోదు కాలేదు. దయచేసి పరిశీలన పేజీ నుండి రీడింగ్ నమోదు చేయండి.";
            resp.setDisplayText(lang.equals("te") ? msgTe : msgEn);
            resp.setSpokenText(resp.getDisplayText());
            return resp;
        }

        double moisture = data.getSoilMoisture();
        String fieldName = (data.getField() != null && data.getField().getFieldName() != null)
                ? data.getField().getFieldName() : "Field";
        boolean isDry = moisture < IrrigationService.MOISTURE_THRESHOLD;

        payload.put("soilMoisture", moisture);
        payload.put("field", fieldName);
        payload.put("threshold", IrrigationService.MOISTURE_THRESHOLD);
        payload.put("isDry", isDry);
        payload.put("requiresIrrigation", isDry);
        resp.setData(payload);

        if (lang.equals("te")) {
            String text = isDry
                    ? String.format("అవును, మీ నేల చాలా ఎండిపోయింది! %s లో తాజా నేల తేమ %.1f%% మాత్రమే ఉంది, ఇది 30%% కనీస ప్రమాణం కంటే తక్కువ. పంటలను కాపాడేందుకు వెంటనే నీటిపారుదల ప్రారంభించండి.", fieldName, moisture)
                    : String.format("లేదు, మీ నేల ఎండిపోలేదు. %s లో తాజా నేల తేమ %.1f%% తో తగినంతగా ఉంది (30%% కంటే ఎక్కువ). నేలలో సాధారణ తేమ ఉంది.", fieldName, moisture);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = isDry
                    ? String.format("Yes, your soil is too dry! The latest soil moisture is %.1f%% for %s, which is below the 30.0%% minimum threshold. Irrigation is required immediately.", moisture, fieldName)
                    : String.format("No, your soil is not too dry. The latest soil moisture is %.1f%% for %s, which is within the safe normal range (30.0%% or above).", moisture, fieldName);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleMonitoringHistoryQuery(User user, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("MONITORING_HISTORY");
        resp.setAction("NAVIGATE");
        resp.setRedirectUrl("monitoring-history.html");

        List<MonitoringData> historyList;
        if (user.getRole() == Role.ADMINISTRATOR) {
            historyList = monitoringDataRepository.findAllByOrderByDateTimeDesc();
        } else {
            historyList = monitoringDataRepository.findByFieldUserOrderByDateTimeDesc(user);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("recordCount", historyList.size());
        resp.setData(payload);

        if (historyList.isEmpty()) {
            String msgEn = "You have no monitoring records saved yet. Opening the monitoring history page.";
            String msgTe = "ఇంతవరకు ఎటువంటి పరిశీలన రికార్డులు నమోదు కాలేదు. పర్యవేక్షణ చరిత్ర పేజీకి వెళ్తున్నాము.";
            resp.setDisplayText(lang.equals("te") ? msgTe : msgEn);
            resp.setSpokenText(resp.getDisplayText());
            return resp;
        }

        MonitoringData latest = historyList.get(0);
        String fieldName = (latest.getField() != null && latest.getField().getFieldName() != null)
                ? latest.getField().getFieldName() : "Field";
        String irrigationStatus = (latest.getSoilMoisture() != null && latest.getSoilMoisture() < IrrigationService.MOISTURE_THRESHOLD)
                ? "Irrigation Required" : "Moisture Level Normal";

        if (lang.equals("te")) {
            String text = String.format("మీరు మొత్తం %d పర్యవేక్షణ రికార్డులు నమోదు చేశారు. తాజా రీడింగ్ (%s): ఉష్ణోగ్రత %.1f°C, గాలిలో తేమ %.0f%%, నేల తేమ %.1f%%. పర్యవేక్షణ చరిత్ర పేజీకి వెళ్తున్నాము.",
                    historyList.size(), fieldName, latest.getTemperature(), latest.getHumidity(), latest.getSoilMoisture());
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = String.format("You have %d monitoring records logged. The latest reading for %s is %.1f°C temperature, %.0f%% humidity, and %.1f%% soil moisture (%s). Opening your monitoring history.",
                    historyList.size(), fieldName, latest.getTemperature(), latest.getHumidity(), latest.getSoilMoisture(), irrigationStatus);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleSoilMoistureQuery(MonitoringData data, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("CHECK_SOIL_MOISTURE");
        resp.setAction("READ_DATA");
        Map<String, Object> payload = new HashMap<>();

        if (data == null || data.getSoilMoisture() == null) {
            String msgEn = "No soil moisture readings have been recorded yet. Please enter a reading from the Monitoring page.";
            String msgTe = "ఇంతవరకు నేల తేమ కొలతలు నమోదు కాలేదు. దయచేసి పరిశీలన పేజీ నుండి రీడింగ్ నమోదు చేయండి.";
            resp.setDisplayText(lang.equals("te") ? msgTe : msgEn);
            resp.setSpokenText(resp.getDisplayText());
            return resp;
        }

        double moisture = data.getSoilMoisture();
        String fieldName = (data.getField() != null && data.getField().getFieldName() != null)
                ? data.getField().getFieldName() : "Field";
        boolean requiresIrrigation = moisture < IrrigationService.MOISTURE_THRESHOLD;

        payload.put("soilMoisture", moisture);
        payload.put("field", fieldName);
        payload.put("threshold", IrrigationService.MOISTURE_THRESHOLD);
        payload.put("requiresIrrigation", requiresIrrigation);
        resp.setData(payload);

        if (lang.equals("te")) {
            String irrigationAdvice = requiresIrrigation
                    ? "ఇది 30% పరిమితి కంటే తక్కువగా ఉంది. నీటిపారుదల వెంటనే అవసరం!"
                    : "ఇది 30% కంటే ఎక్కువగా ఉండి సాధారణ స్థాయిలో ఉంది.";
            String text = String.format("తాజా నేల తేమ %.1f%% (%s). %s", moisture, fieldName, irrigationAdvice);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String irrigationAdvice = requiresIrrigation
                    ? "It is below the 30% threshold. Irrigation is required immediately!"
                    : "Moisture level is normal and adequate.";
            String text = String.format("The latest soil moisture is %.1f%% for %s. %s", moisture, fieldName, irrigationAdvice);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleIrrigationQuery(MonitoringData data, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("IRRIGATION_STATUS");
        resp.setAction("READ_DATA");
        Map<String, Object> payload = new HashMap<>();

        if (data == null || data.getSoilMoisture() == null) {
            String msg = lang.equals("te")
                    ? "క్షమించండి, నీటిపారుదల నిర్ధారణ కోసం పరిశీలన రికార్డులు అందుబాటులో లేవు."
                    : "No telemetry records found to evaluate irrigation status.";
            resp.setDisplayText(msg);
            resp.setSpokenText(msg);
            return resp;
        }

        double moisture = data.getSoilMoisture();
        boolean required = moisture < IrrigationService.MOISTURE_THRESHOLD;
        payload.put("soilMoisture", moisture);
        payload.put("irrigationRequired", required);
        payload.put("threshold", IrrigationService.MOISTURE_THRESHOLD);
        resp.setData(payload);

        if (lang.equals("te")) {
            String text = required
                    ? String.format("అవును, నీటిపారుదల ఖచ్చితంగా అవసరం! నేల తేమ %.1f%% గా ఉంది, ఇది 30%% ప్రమాణం కంటే తక్కువ.", moisture)
                    : String.format("లేదు, ప్రస్తుతం నీటిపారుదల అవసరం లేదు. నేల తేమ %.1f%% తో తగినంతగా ఉంది.", moisture);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = required
                    ? String.format("Yes, irrigation is required! Latest soil moisture is %.1f%%, which is below the 30.0%% threshold.", moisture)
                    : String.format("No, irrigation is not required right now. Soil moisture is healthy at %.1f%%.", moisture);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleWeatherQuery(MonitoringData data, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("TELEMETRY_WEATHER");
        resp.setAction("READ_DATA");

        if (data == null) {
            String msg = lang.equals("te")
                    ? "వాతావరణ కొలతలు అందుబాటులో లేవు."
                    : "No ambient temperature and humidity records available.";
            resp.setDisplayText(msg);
            resp.setSpokenText(msg);
            return resp;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("temperature", data.getTemperature());
        payload.put("humidity", data.getHumidity());
        payload.put("soilMoisture", data.getSoilMoisture());
        resp.setData(payload);

        if (lang.equals("te")) {
            String text = String.format("తాజా ఉష్ణోగ్రత %.1f°C, మరియు గాలిలో తేమ %.1f%% గా నమోదైంది.",
                    data.getTemperature(), data.getHumidity());
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = String.format("Latest conditions: Temperature is %.1f°C, and relative humidity is %.1f%%.",
                    data.getTemperature(), data.getHumidity());
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleAlertsQuery(List<Alert> activeAlerts, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("CHECK_ALERTS");
        resp.setAction("READ_DATA");
        resp.setRedirectUrl("alerts.html");

        Map<String, Object> payload = new HashMap<>();
        payload.put("activeAlertCount", activeAlerts.size());
        resp.setData(payload);

        if (activeAlerts.isEmpty()) {
            String text = lang.equals("te")
                    ? "ప్రస్తుతం ఎటువంటి హెచ్చరికలు లేవు. మీ పంట పొలాలు సురక్షిత స్థితిలో ఉన్నాయి."
                    : "You have no active alerts. All field conditions are normal.";
            resp.setDisplayText(text);
            resp.setSpokenText(text);
            return resp;
        }

        Alert latest = activeAlerts.get(0);
        String alertMsg = latest.getMessage() != null ? latest.getMessage() : "Critical condition detected";

        if (lang.equals("te")) {
            String text = String.format("మీకు %d క్రియాశీల హెచ్చరికలు ఉన్నాయి. తాజా హెచ్చరిక: %s",
                    activeAlerts.size(), alertMsg);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        } else {
            String text = String.format("You have %d active alert%s. Latest alert: %s",
                    activeAlerts.size(), activeAlerts.size() > 1 ? "s" : "", alertMsg);
            resp.setDisplayText(text);
            resp.setSpokenText(text);
        }
        return resp;
    }

    private VoiceQueryResponse handleSummaryQuery(MonitoringData data, List<Alert> activeAlerts,
                                                  long fieldCount, long cropCount, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("DASHBOARD_SUMMARY");
        resp.setAction("READ_DATA");
        resp.setRedirectUrl("farmer-dashboard.html");

        Double moisture = data != null ? data.getSoilMoisture() : null;
        Double temp = data != null ? data.getTemperature() : null;
        Double hum = data != null ? data.getHumidity() : null;
        boolean irrigationRequired = moisture != null && moisture < IrrigationService.MOISTURE_THRESHOLD;
        String fieldName = (data != null && data.getField() != null && data.getField().getFieldName() != null)
                ? data.getField().getFieldName() : "your fields";

        Map<String, Object> payload = new HashMap<>();
        payload.put("fieldCount", fieldCount);
        payload.put("cropCount", cropCount);
        payload.put("moisture", moisture);
        payload.put("temperature", temp);
        payload.put("humidity", hum);
        payload.put("activeAlertCount", activeAlerts.size());
        payload.put("irrigationRequired", irrigationRequired);
        resp.setData(payload);

        if (lang.equals("te")) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("వ్యవసాయ ప్రస్తుత పరిస్థితి: మీకు %d పొలాలు మరియు %d పంటలు ఉన్నాయి. ", fieldCount, cropCount));
            if (data != null && moisture != null) {
                sb.append(String.format("తాజా కొలతలు (%s వద్ద): ఉష్ణోగ్రత %.1f°C, గాలిలో తేమ %.0f%%, మరియు నేల తేమ %.1f%%. ",
                        fieldName, temp != null ? temp : 0.0, hum != null ? hum : 0.0, moisture));
                sb.append(irrigationRequired ? "నీటిపారుదల వెంటనే అవసరం! " : "నేలలో తేమ సాధారణంగా ఉంది. ");
            } else {
                sb.append("ఇంతవరకు పర్యవేక్షణ రీడింగులు నమోదు కాలేదు. ");
            }
            if (activeAlerts.isEmpty()) {
                sb.append("క్రియాశీల హెచ్చరికలు లేవు.");
            } else {
                sb.append(String.format("%d క్రియాశీల హెచ్చరికలు ఉన్నాయి, వెంటనే గమనించండి.", activeAlerts.size()));
            }
            resp.setDisplayText(sb.toString());
            resp.setSpokenText(sb.toString());
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Here is your farm condition overview: You have %d field%s and %d crop%s registered. ",
                    fieldCount, fieldCount == 1 ? "" : "s",
                    cropCount, cropCount == 1 ? "" : "s"));
            if (data != null && moisture != null) {
                sb.append(String.format("Latest observations for %s show %.1f°C temperature, %.0f%% humidity, and %.1f%% soil moisture. ",
                        fieldName, temp != null ? temp : 0.0, hum != null ? hum : 0.0, moisture));
                sb.append(irrigationRequired ? "Irrigation is currently required! " : "Moisture level is normal. ");
            } else {
                sb.append("No telemetry readings logged yet. ");
            }
            if (activeAlerts.isEmpty()) {
                sb.append("There are no active alerts.");
            } else {
                sb.append(String.format("You have %d active alert%s requiring attention.", activeAlerts.size(), activeAlerts.size() == 1 ? "" : "s"));
            }
            resp.setDisplayText(sb.toString());
            resp.setSpokenText(sb.toString());
        }
        return resp;
    }

    private VoiceQueryResponse handleCropRecommendationQuery(MonitoringData data, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("CROP_RECOMMENDATION");
        resp.setAction("READ_DATA");
        resp.setRedirectUrl("recommendation.html");

        RecommendationRequest req = new RecommendationRequest();
        String fieldName = "your field";
        if (data != null) {
            req.setTemperature(data.getTemperature() != null ? data.getTemperature() : 28.0);
            req.setHumidity(data.getHumidity() != null ? data.getHumidity() : 65.0);
            req.setSoilMoisture(data.getSoilMoisture() != null ? data.getSoilMoisture() : 35.0);
            String soilType = (data.getField() != null && data.getField().getSoilType() != null)
                    ? data.getField().getSoilType() : "Loamy";
            req.setSoilType(soilType);
            if (data.getField() != null && data.getField().getFieldName() != null) {
                fieldName = data.getField().getFieldName();
            }
        } else {
            req.setTemperature(28.0);
            req.setHumidity(65.0);
            req.setSoilMoisture(35.0);
            req.setSoilType("Loamy");
        }

        List<RecommendationResultDto> recommendations = cropRecommendationService.getRecommendations(req);

        if (recommendations.isEmpty()) {
            String text = lang.equals("te")
                    ? "ప్రస్తుత పరిస్థితులకు సరిపోయే పంట సిఫార్సులు లభించలేదు."
                    : "No crop recommendations matched the current field conditions.";
            resp.setDisplayText(text);
            resp.setSpokenText(text);
            return resp;
        }

        List<RecommendationResultDto> topCrops = recommendations.stream()
                .filter(r -> r.getSuitabilityScore() >= 60)
                .limit(3)
                .toList();
        if (topCrops.isEmpty() && !recommendations.isEmpty()) {
            topCrops = List.of(recommendations.get(0));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("topCrop", recommendations.get(0).getCropName());
        payload.put("score", recommendations.get(0).getSuitabilityScore());
        payload.put("suitableCount", topCrops.size());
        resp.setData(payload);

        if (lang.equals("te")) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("ప్రస్తుత పొలం పరిస్థితుల ప్రకారం (%s - నేల: %s, ఉష్ణోగ్రత: %.1f°C, తేమ: %.0f%%), అనుకూలమైన పంటలు: ",
                    fieldName, req.getSoilType(), req.getTemperature(), req.getSoilMoisture()));
            for (int i = 0; i < topCrops.size(); i++) {
                RecommendationResultDto c = topCrops.get(i);
                sb.append(c.getCropName()).append(" (").append(c.getSuitabilityScore()).append("% అనుకూలం)");
                if (i < topCrops.size() - 1) sb.append(", ");
            }
            sb.append(". మరిన్ని వివరాల కోసం పంట సిఫార్సుల పేజీని చూడండి.");
            resp.setDisplayText(sb.toString());
            resp.setSpokenText(String.format("మీ పొలానికి అత్యంత అనుకూలమైన పంట %s, %d శాతం అనుకూలతతో.", topCrops.get(0).getCropName(), topCrops.get(0).getSuitabilityScore()));
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Based on current conditions for %s (Soil: %s, Temp: %.1f°C, Moisture: %.0f%%), suitable crops are: ",
                    fieldName, req.getSoilType(), req.getTemperature(), req.getSoilMoisture()));
            for (int i = 0; i < topCrops.size(); i++) {
                RecommendationResultDto c = topCrops.get(i);
                sb.append(c.getCropName()).append(" (").append(c.getSuitabilityScore()).append("% suitable)");
                if (i < topCrops.size() - 1) sb.append(", ");
            }
            sb.append(". ").append(topCrops.get(0).getCropName()).append(" is top-ranked: ").append(topCrops.get(0).getReason());
            resp.setDisplayText(sb.toString());
            resp.setSpokenText(String.format("Based on your field conditions, the most suitable crop is %s with %d percent suitability.", topCrops.get(0).getCropName(), topCrops.get(0).getSuitabilityScore()));
        }
        return resp;
    }

    private VoiceQueryResponse handleHelpQuery(String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("HELP");
        resp.setAction("NONE");

        if (lang.equals("te")) {
            String text = "మీరు అడగగల ప్రశ్నలు: 'నేల తేమ శాతం ఎంత?', 'ప్రస్తుత ఉష్ణోగ్రత ఎంత?', 'నేల ఎండిపోయిందా?', 'పొలానికి నీరు పెట్టాలా?', 'నీటిపారుదల స్థితి చూపించు', 'ఏవైనా హెచ్చరికలు ఉన్నాయా?', 'పంట సిఫార్సులు చెప్పు', 'నా పొలానికి ఏ పంటలు అనుకూలం?', 'పర్యవేక్షణ చరిత్ర చూపించు', లేదా 'వ్యవసాయ ప్రస్తుత పరిస్థితి వివరించు'.";
            resp.setDisplayText(text);
            resp.setSpokenText("మీరు నేల తేమ, ఉష్ణోగ్రత, నీటిపారుదల, హెచ్చరికలు, పంట సిఫార్సులు, లేదా వ్యవసాయ పరిస్థితి గురించి అడగవచ్చు.");
        } else {
            String text = "Supported voice queries: 'What is my soil moisture level?', 'What is the current temperature?', 'Is my soil too dry?', 'Should I irrigate my field?', 'Show my irrigation status.', 'Are there any alerts for my farm?', 'Give me crop recommendations.', 'What crops are suitable for my field?', 'Show my monitoring history.', or 'Explain the current condition of my farm.'";
            resp.setDisplayText(text);
            resp.setSpokenText("You can ask about soil moisture, temperature, irrigation requirement, active alerts, crop suitability, or your overall farm condition.");
        }
        return resp;
    }

    private VoiceQueryResponse handleUnknownQuery(String rawQuery, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("UNKNOWN");
        resp.setAction("NONE");

        if (lang.equals("te")) {
            String text = String.format("క్షమించండి, '%s' అర్థం కాలేదు. సహాయం కోసం 'సహాయం' అని అడగండి.", rawQuery);
            resp.setDisplayText(text);
            resp.setSpokenText("క్షమించండి, మీ ప్రశ్న స్పష్టంగా అర్థం కాలేదు. సహాయం అని అడిగి అందుబాటులో ఉన్న ప్రశ్నలను వినండి.");
        } else {
            String text = String.format("I did not understand '%s'. You can ask about soil moisture, temperature, irrigation status, alerts, or crop recommendations. Say 'Help' to hear all supported commands.", rawQuery);
            resp.setDisplayText(text);
            resp.setSpokenText("I didn't quite catch that. You can ask about soil moisture, temperature, irrigation, alerts, or say help for commands.");
        }
        return resp;
    }

    private VoiceQueryResponse buildNavigationResponse(String url, String intent, String text, String lang) {
        VoiceQueryResponse resp = new VoiceQueryResponse();
        resp.setIntent("NAVIGATE_" + intent);
        resp.setAction("NAVIGATE");
        resp.setRedirectUrl(url);
        resp.setDisplayText(text);
        resp.setSpokenText(text);
        return resp;
    }

    private boolean matchesAny(String input, String... keywords) {
        if (input == null) return false;
        for (String kw : keywords) {
            if (input.contains(kw.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    public Map<String, Object> getSupportedCommands(String lang) {
        Map<String, Object> map = new LinkedHashMap<>();
        if ("te".equalsIgnoreCase(lang)) {
            map.put("language", "Telugu (తెలుగు)");
            map.put("queries", List.of(
                    "నేల తేమ శాతం ఎంత? (What is my soil moisture level?)",
                    "ప్రస్తుత ఉష్ణోగ్రత ఎంత? (What is the current temperature?)",
                    "నేల ఎండిపోయిందా? (Is my soil too dry?)",
                    "పొలానికి నీరు పెట్టాలా? (Should I irrigate my field?)",
                    "నీటిపారుదల స్థితి చూపించు (Show my irrigation status)",
                    "ఏవైనా హెచ్చరికలు ఉన్నాయా? (Are there any alerts for my farm?)",
                    "పంట సిఫార్సులు చెప్పు (Give me crop recommendations)",
                    "నా పొలానికి ఏ పంటలు అనుకూలం? (What crops are suitable for my field?)",
                    "పర్యవేక్షణ చరిత్ర చూపించు (Show my monitoring history)",
                    "వ్యవసాయ ప్రస్తుత పరిస్థితి వివరించు (Explain the current condition of my farm)"
            ));
        } else {
            map.put("language", "English");
            map.put("queries", List.of(
                    "What is my soil moisture level?",
                    "What is the current temperature?",
                    "Is my soil too dry?",
                    "Should I irrigate my field?",
                    "Show my irrigation status.",
                    "Are there any alerts for my farm?",
                    "Give me crop recommendations.",
                    "What crops are suitable for my field?",
                    "Show my monitoring history.",
                    "Explain the current condition of my farm."
            ));
        }
        return map;
    }
}
