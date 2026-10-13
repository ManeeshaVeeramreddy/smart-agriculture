package com.samagri.service;

import com.samagri.dto.AdviceItemDto;
import com.samagri.dto.AdvisoryDto;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.*;
import com.samagri.repository.CropRepository;
import com.samagri.repository.CropRequirementRepository;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.MonitoringDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/** Builds the "what should I do today?" advice for each of a farmer's fields. */
@Service
public class AdvisoryService {

    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final CropRequirementRepository cropRequirementRepository;
    private final MonitoringDataRepository monitoringDataRepository;

    public AdvisoryService(FieldRepository fieldRepository,
                           CropRepository cropRepository,
                           CropRequirementRepository cropRequirementRepository,
                           MonitoringDataRepository monitoringDataRepository) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.cropRequirementRepository = cropRequirementRepository;
        this.monitoringDataRepository = monitoringDataRepository;
    }

    @Transactional(readOnly = true)
    public List<AdvisoryDto> getAdvisoryForUser(User user) {
        List<Field> fields = user.getRole() == Role.ADMINISTRATOR
                ? fieldRepository.findAll()
                : fieldRepository.findByUser(user);
        List<AdvisoryDto> result = new ArrayList<>();
        for (Field field : fields) {
            result.add(buildAdvisory(field));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public AdvisoryDto getAdvisoryForField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));
        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }
        return buildAdvisory(field);
    }

    private AdvisoryDto buildAdvisory(Field field) {
        MonitoringData latest = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field).orElse(null);
        LocalDate today = LocalDate.now();

        List<AdvisoryEngine.CropInfo> cropInfos = new ArrayList<>();
        List<String> cropNames = new ArrayList<>();
        for (Crop crop : cropRepository.findByField(field)) {
            if ("Harvested".equalsIgnoreCase(crop.getCropStatus())) {
                continue; // already harvested - no more advice for it
            }
            cropNames.add(crop.getCropName());
            CropRequirement req = cropRequirementRepository.findByCropNameIgnoreCase(crop.getCropName()).orElse(null);
            Integer daysToHarvest = crop.getExpectedHarvestDate() == null
                    ? null
                    : (int) ChronoUnit.DAYS.between(today, crop.getExpectedHarvestDate());
            cropInfos.add(new AdvisoryEngine.CropInfo(
                    crop.getCropName(),
                    req != null ? req.getMinimumTemperature() : null,
                    req != null ? req.getMaximumTemperature() : null,
                    req != null ? req.getMinimumSoilMoisture() : null,
                    req != null ? req.getMaximumSoilMoisture() : null,
                    daysToHarvest));
        }

        Double temperature = latest != null ? latest.getTemperature() : null;
        Double humidity = latest != null ? latest.getHumidity() : null;
        Double moisture = latest != null ? latest.getSoilMoisture() : null;
        LocalDateTime when = latest != null ? latest.getDateTime() : null;

        List<AdviceItemDto> advice = AdvisoryEngine.advise(
                field.getFieldName(), field.getArea() != null ? field.getArea() : 0,
                temperature, humidity, moisture, when, LocalDateTime.now(), cropInfos);

        AdvisoryDto dto = new AdvisoryDto();
        dto.setFieldId(field.getFieldId());
        dto.setFieldName(field.getFieldName());
        dto.setLocation(field.getLocation());
        dto.setArea(field.getArea());
        dto.setSoilType(field.getSoilType());
        dto.setSoilMoisture(moisture);
        dto.setTemperature(temperature);
        dto.setHumidity(humidity);
        dto.setLastReading(when);
        dto.setCrops(cropNames);
        dto.setAdvice(advice);
        dto.setStatus(AdvisoryEngine.overallStatus(moisture, advice));
        return dto;
    }
}
