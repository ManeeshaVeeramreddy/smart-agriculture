package com.samagri.service;

import com.samagri.dto.IrrigationStatusDto;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.Field;
import com.samagri.model.IrrigationStatus;
import com.samagri.model.MonitoringData;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.IrrigationStatusRepository;
import com.samagri.repository.MonitoringDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class IrrigationService {

    public static final double MOISTURE_THRESHOLD = 30.0;
    public static final String STATUS_IRRIGATION_REQUIRED = "Irrigation Required";
    public static final String STATUS_MOISTURE_NORMAL = "Moisture Level Normal";

    private final IrrigationStatusRepository irrigationStatusRepository;
    private final MonitoringDataRepository monitoringDataRepository;
    private final FieldRepository fieldRepository;

    public IrrigationService(IrrigationStatusRepository irrigationStatusRepository,
                             MonitoringDataRepository monitoringDataRepository,
                             FieldRepository fieldRepository) {
        this.irrigationStatusRepository = irrigationStatusRepository;
        this.monitoringDataRepository = monitoringDataRepository;
        this.fieldRepository = fieldRepository;
    }

    /**
     * Core Business Logic:
     * IF soil moisture < 30%
     *     Irrigation Status = "Irrigation Required"
     * ELSE
     *     Irrigation Status = "Moisture Level Normal"
     */
    public String evaluateIrrigationStatus(Double soilMoisture) {
        if (soilMoisture == null) {
            return STATUS_MOISTURE_NORMAL;
        }
        if (soilMoisture < MOISTURE_THRESHOLD) {
            return STATUS_IRRIGATION_REQUIRED;
        } else {
            return STATUS_MOISTURE_NORMAL;
        }
    }

    public String generateIrrigationAdvice(Double soilMoisture) {
        if (soilMoisture == null) {
            return "No monitoring reading recorded yet.";
        }
        if (soilMoisture < MOISTURE_THRESHOLD) {
            return String.format("Soil moisture is critical (%.1f%%, below %.0f%%). Turn on irrigation pumps immediately.", soilMoisture, MOISTURE_THRESHOLD);
        } else {
            return String.format("Soil moisture is optimal (%.1f%%). No irrigation needed at this moment.", soilMoisture);
        }
    }

    @Transactional
    public IrrigationStatus recordIrrigationStatus(Field field, Double soilMoisture, LocalDateTime dateTime) {
        String status = evaluateIrrigationStatus(soilMoisture);
        IrrigationStatus record = new IrrigationStatus();
        record.setField(field);
        record.setSoilMoisture(soilMoisture);
        record.setThreshold(MOISTURE_THRESHOLD);
        record.setStatus(status);
        record.setCheckedDateTime(dateTime != null ? dateTime : LocalDateTime.now());
        return irrigationStatusRepository.save(record);
    }

    @Transactional(readOnly = true)
    public IrrigationStatusDto getIrrigationStatusForField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        MonitoringData latestData = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field)
                .orElse(null);

        if (latestData == null) {
            return new IrrigationStatusDto(
                    null,
                    field.getFieldId(),
                    field.getFieldName(),
                    STATUS_MOISTURE_NORMAL,
                    MOISTURE_THRESHOLD,
                    null,
                    LocalDateTime.now(),
                    "No monitoring data available for this field yet. Add reading to check irrigation requirements."
            );
        }

        String status = evaluateIrrigationStatus(latestData.getSoilMoisture());
        String advice = generateIrrigationAdvice(latestData.getSoilMoisture());

        return new IrrigationStatusDto(
                null,
                field.getFieldId(),
                field.getFieldName(),
                status,
                MOISTURE_THRESHOLD,
                latestData.getSoilMoisture(),
                latestData.getDateTime(),
                advice
        );
    }
}
