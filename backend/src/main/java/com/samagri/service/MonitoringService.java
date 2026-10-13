package com.samagri.service;

import com.samagri.dto.MonitoringRequest;
import com.samagri.dto.QuickCheckRequest;
import com.samagri.dto.MonitoringResponse;
import com.samagri.exception.BadRequestException;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.*;
import com.samagri.repository.FieldRepository;
import com.samagri.repository.MonitoringDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MonitoringService {

    private final MonitoringDataRepository monitoringDataRepository;
    private final FieldRepository fieldRepository;
    private final IrrigationService irrigationService;
    private final AlertService alertService;

    public MonitoringService(MonitoringDataRepository monitoringDataRepository,
                             FieldRepository fieldRepository,
                             IrrigationService irrigationService,
                             AlertService alertService) {
        this.monitoringDataRepository = monitoringDataRepository;
        this.fieldRepository = fieldRepository;
        this.irrigationService = irrigationService;
        this.alertService = alertService;
    }

    @Transactional
    public MonitoringResponse addMonitoringData(MonitoringRequest request, User user) {
        // 1. Validate data
        if (request.getHumidity() < 0 || request.getHumidity() > 100) {
            throw new BadRequestException("Humidity must be between 0% and 100%.");
        }
        if (request.getSoilMoisture() < 0 || request.getSoilMoisture() > 100) {
            throw new BadRequestException("Soil moisture must be between 0% and 100%.");
        }

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + request.getFieldId() + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        LocalDateTime timestamp = request.getDateTime() != null ? request.getDateTime() : LocalDateTime.now();

        // 2. Save it to MySQL
        MonitoringData data = new MonitoringData();
        data.setField(field);
        data.setTemperature(request.getTemperature());
        data.setHumidity(request.getHumidity());
        data.setSoilMoisture(request.getSoilMoisture());
        data.setDateTime(timestamp);

        MonitoringData savedData = monitoringDataRepository.save(data);

        // 3. Determine irrigation status
        String irrigationStatus = irrigationService.evaluateIrrigationStatus(savedData.getSoilMoisture());
        irrigationService.recordIrrigationStatus(field, savedData.getSoilMoisture(), timestamp);

        // 4. Generate alert if necessary (< 30%)
        Alert alert = alertService.checkAndCreateAlert(field, savedData.getSoilMoisture(), timestamp);

        // 5. Display the latest result
        return new MonitoringResponse(
                savedData.getMonitoringId(),
                field.getFieldId(),
                field.getFieldName(),
                savedData.getTemperature(),
                savedData.getHumidity(),
                savedData.getSoilMoisture(),
                savedData.getDateTime(),
                irrigationStatus,
                alert != null,
                alert != null ? alert.getMessage() : null
        );
    }

    /**
     * "Feel test" entry for farmers without sensors: DRY / MOIST / WET is converted to a soil moisture
     * percentage. Temperature and humidity come from the request (weather service), otherwise from the
     * field's previous reading, otherwise from typical defaults.
     */
    @Transactional
    public MonitoringResponse addQuickCheck(QuickCheckRequest request, User user) {
        double moisture;
        try {
            moisture = AdvisoryEngine.moistureFromFeel(request.getSoilFeel());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + request.getFieldId() + " not found."));
        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        MonitoringData previous = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field).orElse(null);
        double temperature = request.getTemperature() != null ? request.getTemperature()
                : (previous != null ? previous.getTemperature() : 28.0);
        double humidity = request.getHumidity() != null ? request.getHumidity()
                : (previous != null ? previous.getHumidity() : 60.0);

        return addMonitoringData(
                new MonitoringRequest(field.getFieldId(), temperature, humidity, moisture, null), user);
    }

    @Transactional(readOnly = true)
    public MonitoringResponse getLatestMonitoringData(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        MonitoringData latest = monitoringDataRepository.findFirstByFieldOrderByDateTimeDesc(field)
                .orElseThrow(() -> new ResourceNotFoundException("No monitoring data recorded yet for field: " + field.getFieldName()));

        String irrigationStatus = irrigationService.evaluateIrrigationStatus(latest.getSoilMoisture());
        boolean hasActiveAlert = latest.getSoilMoisture() < IrrigationService.MOISTURE_THRESHOLD;

        return new MonitoringResponse(
                latest.getMonitoringId(),
                field.getFieldId(),
                field.getFieldName(),
                latest.getTemperature(),
                latest.getHumidity(),
                latest.getSoilMoisture(),
                latest.getDateTime(),
                irrigationStatus,
                hasActiveAlert,
                hasActiveAlert ? AlertService.ALERT_MSG_LOW_MOISTURE : null
        );
    }

    @Transactional(readOnly = true)
    public List<MonitoringResponse> getMonitoringHistory(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        return monitoringDataRepository.findByFieldOrderByDateTimeDesc(field)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MonitoringResponse> getAllMonitoringForUser(User user) {
        List<MonitoringData> list;
        if (user.getRole() == Role.ADMINISTRATOR) {
            list = monitoringDataRepository.findAllByOrderByDateTimeDesc();
        } else {
            list = monitoringDataRepository.findByFieldUserOrderByDateTimeDesc(user);
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MonitoringResponse getMonitoringById(Long id, User user) {
        MonitoringData data = monitoringDataRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monitoring record with ID " + id + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !data.getField().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Monitoring record not found or access denied.");
        }

        return toResponse(data);
    }

    private MonitoringResponse toResponse(MonitoringData data) {
        String irrigationStatus = irrigationService.evaluateIrrigationStatus(data.getSoilMoisture());
        boolean isLowMoisture = data.getSoilMoisture() < IrrigationService.MOISTURE_THRESHOLD;

        return new MonitoringResponse(
                data.getMonitoringId(),
                data.getField() != null ? data.getField().getFieldId() : null,
                data.getField() != null ? data.getField().getFieldName() : null,
                data.getTemperature(),
                data.getHumidity(),
                data.getSoilMoisture(),
                data.getDateTime(),
                irrigationStatus,
                isLowMoisture,
                isLowMoisture ? AlertService.ALERT_MSG_LOW_MOISTURE : null
        );
    }
}
