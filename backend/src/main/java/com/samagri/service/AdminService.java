package com.samagri.service;

import com.samagri.dto.*;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final MonitoringDataRepository monitoringDataRepository;
    private final AlertRepository alertRepository;
    private final FieldService fieldService;
    private final CropService cropService;
    private final AlertService alertService;
    private final IrrigationService irrigationService;

    public AdminService(UserRepository userRepository,
                        FieldRepository fieldRepository,
                        CropRepository cropRepository,
                        MonitoringDataRepository monitoringDataRepository,
                        AlertRepository alertRepository,
                        FieldService fieldService,
                        CropService cropService,
                        AlertService alertService,
                        IrrigationService irrigationService) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.monitoringDataRepository = monitoringDataRepository;
        this.alertRepository = alertRepository;
        this.fieldService = fieldService;
        this.cropService = cropService;
        this.alertService = alertService;
        this.irrigationService = irrigationService;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto getSystemStats() {
        long totalUsers = userRepository.count();
        long totalFarmers = userRepository.countByRole(Role.FARMER);
        long totalFields = fieldRepository.count();
        long totalCrops = cropRepository.count();
        long totalMonitoring = monitoringDataRepository.count();
        long activeAlerts = alertRepository.countByStatus(AlertService.STATUS_ACTIVE);

        return new AdminStatsDto(
                totalUsers,
                totalFarmers,
                totalFields,
                totalCrops,
                totalMonitoring,
                activeAlerts
        );
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(u -> new UserDto(
                u.getUserId(),
                u.getName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole(),
                u.getFields() != null ? u.getFields().size() : 0
        )).collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + userId + " not found."));
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<FieldDto> getAllFields() {
        return fieldRepository.findAll().stream()
                .map(fieldService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CropDto> getAllCrops() {
        return cropRepository.findAll().stream()
                .map(cropService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MonitoringResponse> getAllMonitoringRecords() {
        return monitoringDataRepository.findAllByOrderByDateTimeDesc().stream()
                .map(d -> new MonitoringResponse(
                        d.getMonitoringId(),
                        d.getField() != null ? d.getField().getFieldId() : null,
                        d.getField() != null ? d.getField().getFieldName() : null,
                        d.getTemperature(),
                        d.getHumidity(),
                        d.getSoilMoisture(),
                        d.getDateTime(),
                        irrigationService.evaluateIrrigationStatus(d.getSoilMoisture()),
                        d.getSoilMoisture() < IrrigationService.MOISTURE_THRESHOLD,
                        d.getSoilMoisture() < IrrigationService.MOISTURE_THRESHOLD ? AlertService.ALERT_MSG_LOW_MOISTURE : null
                )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedDateTimeDesc().stream()
                .map(alertService::toDto)
                .collect(Collectors.toList());
    }
}
