package com.samagri.service;

import com.samagri.dto.FieldDto;
import com.samagri.exception.ResourceNotFoundException;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FieldService {

    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final MonitoringDataRepository monitoringDataRepository;
    private final AlertRepository alertRepository;
    private final IrrigationService irrigationService;

    public FieldService(FieldRepository fieldRepository,
                        CropRepository cropRepository,
                        MonitoringDataRepository monitoringDataRepository,
                        AlertRepository alertRepository,
                        IrrigationService irrigationService) {
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.monitoringDataRepository = monitoringDataRepository;
        this.alertRepository = alertRepository;
        this.irrigationService = irrigationService;
    }

    @Transactional
    public FieldDto createField(FieldDto dto, User user) {
        Field field = new Field();
        field.setFieldName(dto.getFieldName().trim());
        field.setLocation(dto.getLocation().trim());
        field.setArea(dto.getArea());
        field.setSoilType(dto.getSoilType().trim());
        field.setUser(user);

        Field saved = fieldRepository.save(field);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FieldDto> getFieldsByUser(User user) {
        List<Field> fields;
        if (user.getRole() == Role.ADMINISTRATOR) {
            fields = fieldRepository.findAll();
        } else {
            fields = fieldRepository.findByUser(user);
        }
        return fields.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FieldDto getFieldById(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        return toDto(field);
    }

    @Transactional
    public FieldDto updateField(Long fieldId, FieldDto dto, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        field.setFieldName(dto.getFieldName().trim());
        field.setLocation(dto.getLocation().trim());
        field.setArea(dto.getArea());
        field.setSoilType(dto.getSoilType().trim());

        Field updated = fieldRepository.save(field);
        return toDto(updated);
    }

    @Transactional
    public void deleteField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        fieldRepository.delete(field);
    }

    public FieldDto toDto(Field field) {
        FieldDto dto = new FieldDto(
                field.getFieldId(),
                field.getFieldName(),
                field.getLocation(),
                field.getArea(),
                field.getSoilType()
        );
        dto.setUserId(field.getUser() != null ? field.getUser().getUserId() : null);
        dto.setOwnerName(field.getUser() != null ? field.getUser().getName() : "Unknown");

        // Aggregated dynamic stats
        int crops = cropRepository.findByField(field).size();
        dto.setCropCount(crops);

        MonitoringData latest = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field).orElse(null);
        if (latest != null) {
            dto.setLatestTemperature(latest.getTemperature());
            dto.setLatestHumidity(latest.getHumidity());
            dto.setLatestSoilMoisture(latest.getSoilMoisture());
            dto.setIrrigationStatus(irrigationService.evaluateIrrigationStatus(latest.getSoilMoisture()));
        } else {
            dto.setIrrigationStatus(IrrigationService.STATUS_MOISTURE_NORMAL);
        }

        int activeAlerts = alertRepository.findByFieldOrderByCreatedDateTimeDesc(field).stream()
                .filter(a -> AlertService.STATUS_ACTIVE.equalsIgnoreCase(a.getStatus()))
                .mapToInt(e -> 1).sum();
        dto.setActiveAlertCount(activeAlerts);

        return dto;
    }
}
