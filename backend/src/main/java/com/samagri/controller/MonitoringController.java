package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.MonitoringRequest;
import com.samagri.dto.MonitoringResponse;
import com.samagri.dto.QuickCheckRequest;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.MonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monitoring")
@Tag(name = "Monitoring Module", description = "Endpoints for entering and retrieving field monitoring data")
public class MonitoringController {

    private final MonitoringService monitoringService;
    private final AuthService authService;

    public MonitoringController(MonitoringService monitoringService, AuthService authService) {
        this.monitoringService = monitoringService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Record manual or simulated monitoring readings (Temperature, Humidity, Soil Moisture)")
    public ResponseEntity<ApiResponse<MonitoringResponse>> addMonitoringData(@Valid @RequestBody MonitoringRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        MonitoringResponse response = monitoringService.addMonitoringData(request, user);
        return new ResponseEntity<>(ApiResponse.ok("Monitoring data recorded successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/quick")
    @Operation(summary = "Quick soil check by feel (DRY / MOIST / WET) - no typing of numbers needed")
    public ResponseEntity<ApiResponse<MonitoringResponse>> quickCheck(@Valid @RequestBody QuickCheckRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        MonitoringResponse response = monitoringService.addQuickCheck(request, user);
        return new ResponseEntity<>(ApiResponse.ok("Soil check recorded", response), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all monitoring records for the current user")
    public ResponseEntity<ApiResponse<List<MonitoringResponse>>> getAllMonitoring() {
        User user = authService.getCurrentAuthenticatedUser();
        List<MonitoringResponse> list = monitoringService.getAllMonitoringForUser(user);
        return ResponseEntity.ok(ApiResponse.ok("Monitoring records retrieved", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific monitoring record by ID")
    public ResponseEntity<ApiResponse<MonitoringResponse>> getMonitoringById(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        MonitoringResponse response = monitoringService.getMonitoringById(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Monitoring record retrieved", response));
    }

    @GetMapping("/latest/{fieldId}")
    @Operation(summary = "Get the latest monitoring record for a field")
    public ResponseEntity<ApiResponse<MonitoringResponse>> getLatestMonitoring(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        MonitoringResponse response = monitoringService.getLatestMonitoringData(fieldId, user);
        return ResponseEntity.ok(ApiResponse.ok("Latest monitoring data retrieved", response));
    }

    @GetMapping("/history/{fieldId}")
    @Operation(summary = "Get monitoring history for a specific field")
    public ResponseEntity<ApiResponse<List<MonitoringResponse>>> getMonitoringHistory(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        List<MonitoringResponse> history = monitoringService.getMonitoringHistory(fieldId, user);
        return ResponseEntity.ok(ApiResponse.ok("Monitoring history retrieved", history));
    }
}
