package com.samagri.service;

import com.samagri.dto.AlertDto;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.Alert;
import com.samagri.model.Field;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.AlertRepository;
import com.samagri.repository.FieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    public static final String ALERT_TYPE_LOW_MOISTURE = "LOW_SOIL_MOISTURE";
    public static final String ALERT_MSG_LOW_MOISTURE = "Low soil moisture detected. Irrigation is required.";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_RESOLVED = "RESOLVED";

    private final AlertRepository alertRepository;
    private final FieldRepository fieldRepository;

    public AlertService(AlertRepository alertRepository, FieldRepository fieldRepository) {
        this.alertRepository = alertRepository;
        this.fieldRepository = fieldRepository;
    }

    @Transactional
    public Alert checkAndCreateAlert(Field field, Double soilMoisture, LocalDateTime dateTime) {
        if (soilMoisture != null && soilMoisture < IrrigationService.MOISTURE_THRESHOLD) {
            Alert alert = new Alert();
            alert.setField(field);
            alert.setAlertType(ALERT_TYPE_LOW_MOISTURE);
            alert.setMessage(ALERT_MSG_LOW_MOISTURE);
            alert.setStatus(STATUS_ACTIVE);
            alert.setCreatedDateTime(dateTime != null ? dateTime : LocalDateTime.now());
            return alertRepository.save(alert);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getAlertsForUser(User user) {
        List<Alert> alerts;
        if (user.getRole() == Role.ADMINISTRATOR) {
            alerts = alertRepository.findAllByOrderByCreatedDateTimeDesc();
        } else {
            alerts = alertRepository.findByFieldUserOrderByCreatedDateTimeDesc(user);
        }
        return alerts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getActiveAlertsForUser(User user) {
        List<Alert> alerts;
        if (user.getRole() == Role.ADMINISTRATOR) {
            alerts = alertRepository.findAllByOrderByCreatedDateTimeDesc().stream()
                    .filter(a -> STATUS_ACTIVE.equalsIgnoreCase(a.getStatus()))
                    .collect(Collectors.toList());
        } else {
            alerts = alertRepository.findByFieldUserAndStatusOrderByCreatedDateTimeDesc(user, STATUS_ACTIVE);
        }
        return alerts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getAlertsForField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        return alertRepository.findByFieldOrderByCreatedDateTimeDesc(field)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public AlertDto resolveAlert(Long alertId, User user) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert with ID " + alertId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !alert.getField().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Alert not found or access denied.");
        }

        alert.setStatus(STATUS_RESOLVED);
        Alert saved = alertRepository.save(alert);
        return toDto(saved);
    }

    public AlertDto toDto(Alert alert) {
        return new AlertDto(
                alert.getAlertId(),
                alert.getField() != null ? alert.getField().getFieldId() : null,
                alert.getField() != null ? alert.getField().getFieldName() : null,
                alert.getAlertType(),
                alert.getMessage(),
                alert.getCreatedDateTime(),
                alert.getStatus()
        );
    }
}
