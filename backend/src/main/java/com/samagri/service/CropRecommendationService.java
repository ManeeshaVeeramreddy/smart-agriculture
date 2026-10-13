package com.samagri.service;

import com.samagri.dto.RecommendationRequest;
import com.samagri.dto.RecommendationResultDto;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.CropRequirement;
import com.samagri.model.Field;
import com.samagri.model.MonitoringData;
import com.samagri.model.User;
import com.samagri.repository.CropRequirementRepository;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.MonitoringDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CropRecommendationService {

    private final CropRequirementRepository requirementRepository;
    private final FieldRepository fieldRepository;
    private final MonitoringDataRepository monitoringDataRepository;

    public CropRecommendationService(CropRequirementRepository requirementRepository,
                                     FieldRepository fieldRepository,
                                     MonitoringDataRepository monitoringDataRepository) {
        this.requirementRepository = requirementRepository;
        this.fieldRepository = fieldRepository;
        this.monitoringDataRepository = monitoringDataRepository;
    }

    /**
     * Rule-based crop recommendation logic.
     * Evaluates input conditions against stored crop requirements.
     */
    @Transactional(readOnly = true)
    public List<RecommendationResultDto> getRecommendations(RecommendationRequest request) {
        Double temp = request.getTemperature();
        Double humidity = request.getHumidity();
        Double moisture = request.getSoilMoisture();
        String soilType = request.getSoilType() != null ? request.getSoilType().trim() : "Loamy";

        List<CropRequirement> requirements = requirementRepository.findAll();
        List<RecommendationResultDto> results = new ArrayList<>();

        for (CropRequirement req : requirements) {
            RecommendationResultDto evaluated = evaluateCrop(req, temp, humidity, moisture, soilType);
            results.add(evaluated);
        }

        // Sort descending by suitability score
        results.sort(Comparator.comparingInt(RecommendationResultDto::getSuitabilityScore).reversed());
        return results;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResultDto> getRecommendationsForField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        MonitoringData latest = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field)
                .orElse(null);

        Double temp = (latest != null) ? latest.getTemperature() : 28.0;
        Double humidity = (latest != null) ? latest.getHumidity() : 65.0;
        Double moisture = (latest != null) ? latest.getSoilMoisture() : 40.0;
        String soilType = field.getSoilType();

        RecommendationRequest req = new RecommendationRequest(fieldId, temp, humidity, moisture, soilType);
        return getRecommendations(req);
    }

    private RecommendationResultDto evaluateCrop(CropRequirement req, Double temp, Double hum, Double moisture, String soilType) {
        int tempScore = 0;
        int humScore = 0;
        int moistureScore = 0;
        int soilScore = 0;

        List<String> positiveNotes = new ArrayList<>();
        List<String> cautionNotes = new ArrayList<>();

        // 1. Temperature check (25 points max)
        if (temp >= req.getMinimumTemperature() && temp <= req.getMaximumTemperature()) {
            tempScore = 25;
            positiveNotes.add(String.format("Temperature (%.1f°C) is ideal [%.0f-%.0f°C]", temp, req.getMinimumTemperature(), req.getMaximumTemperature()));
        } else {
            double diff = (temp < req.getMinimumTemperature()) ? (req.getMinimumTemperature() - temp) : (temp - req.getMaximumTemperature());
            tempScore = Math.max(5, 25 - (int)(diff * 2.5));
            cautionNotes.add(String.format("Temperature (%.1f°C) deviates from range [%.0f-%.0f°C]", temp, req.getMinimumTemperature(), req.getMaximumTemperature()));
        }

        // 2. Humidity check (25 points max)
        if (hum >= req.getMinimumHumidity() && hum <= req.getMaximumHumidity()) {
            humScore = 25;
            positiveNotes.add(String.format("Humidity (%.1f%%) is ideal [%.0f-%.0f%%]", hum, req.getMinimumHumidity(), req.getMaximumHumidity()));
        } else {
            double diff = (hum < req.getMinimumHumidity()) ? (req.getMinimumHumidity() - hum) : (hum - req.getMaximumHumidity());
            humScore = Math.max(5, 25 - (int)(diff * 1.0));
            cautionNotes.add(String.format("Humidity (%.1f%%) deviates from range [%.0f-%.0f%%]", hum, req.getMinimumHumidity(), req.getMaximumHumidity()));
        }

        // 3. Soil Moisture check (25 points max)
        if (moisture >= req.getMinimumSoilMoisture() && moisture <= req.getMaximumSoilMoisture()) {
            moistureScore = 25;
            positiveNotes.add(String.format("Soil moisture (%.1f%%) is ideal [%.0f-%.0f%%]", moisture, req.getMinimumSoilMoisture(), req.getMaximumSoilMoisture()));
        } else {
            double diff = (moisture < req.getMinimumSoilMoisture()) ? (req.getMinimumSoilMoisture() - moisture) : (moisture - req.getMaximumSoilMoisture());
            moistureScore = Math.max(5, 25 - (int)(diff * 1.0));
            cautionNotes.add(String.format("Soil moisture (%.1f%%) deviates from range [%.0f-%.0f%%]", moisture, req.getMinimumSoilMoisture(), req.getMaximumSoilMoisture()));
        }

        // 4. Soil Type check (25 points max)
        String reqSoilLower = req.getSuitableSoilType().toLowerCase();
        String userSoilLower = soilType.toLowerCase();
        if (reqSoilLower.contains(userSoilLower) || userSoilLower.contains(reqSoilLower)) {
            soilScore = 25;
            positiveNotes.add(String.format("Soil type (%s) is well-suited (%s)", soilType, req.getSuitableSoilType()));
        } else if (reqSoilLower.contains("loamy") && (userSoilLower.contains("clay") || userSoilLower.contains("silt"))) {
            soilScore = 15;
            positiveNotes.add(String.format("Soil type (%s) is moderately compatible with %s", soilType, req.getSuitableSoilType()));
        } else {
            soilScore = 8;
            cautionNotes.add(String.format("Soil type (%s) is not typically preferred (%s preferred)", soilType, req.getSuitableSoilType()));
        }

        int totalScore = Math.min(100, Math.max(10, tempScore + humScore + moistureScore + soilScore));
        boolean isSuitable = totalScore >= 70;

        // Construct descriptive reason text
        StringBuilder reason = new StringBuilder();
        if (totalScore >= 80) {
            reason.append(String.format("%s is highly recommended because ", req.getCropName()));
            reason.append(String.join(", ", positiveNotes)).append(".");
        } else if (totalScore >= 60) {
            reason.append(String.format("%s is moderately suitable. ", req.getCropName()));
            if (!positiveNotes.isEmpty()) {
                reason.append(String.join(", ", positiveNotes)).append(". ");
            }
            if (!cautionNotes.isEmpty()) {
                reason.append("Note: ").append(String.join("; ", cautionNotes)).append(".");
            }
        } else {
            reason.append(String.format("%s is not optimal under current conditions. Reasons: ", req.getCropName()));
            reason.append(String.join("; ", cautionNotes)).append(".");
        }

        return new RecommendationResultDto(
                req.getCropName(),
                totalScore,
                isSuitable,
                reason.toString(),
                req.getMinimumTemperature(),
                req.getMaximumTemperature(),
                req.getMinimumHumidity(),
                req.getMaximumHumidity(),
                req.getMinimumSoilMoisture(),
                req.getMaximumSoilMoisture(),
                req.getSuitableSoilType()
        );
    }
}
