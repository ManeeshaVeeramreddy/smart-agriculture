package com.samagri.controller;

import com.samagri.dto.AlertDto;
import com.samagri.dto.ApiResponse;
import com.samagri.model.User;
import com.samagri.service.AlertService;
import com.samagri.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Alert Module", description = "Endpoints for reviewing and acknowledging low moisture alerts")
public class AlertController {

    private final AlertService alertService;
    private final AuthService authService;

    public AlertController(AlertService alertService, AuthService authService) {
        this.alertService = alertService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get all alerts for the authenticated farmer/admin")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAlerts(@RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly) {
        User user = authService.getCurrentAuthenticatedUser();
        List<AlertDto> alerts = activeOnly ? alertService.getActiveAlertsForUser(user) : alertService.getAlertsForUser(user);
        return ResponseEntity.ok(ApiResponse.ok("Alerts retrieved", alerts));
    }

    @GetMapping("/{fieldId}")
    @Operation(summary = "Get alerts for a specific field")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAlertsByField(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        List<AlertDto> alerts = alertService.getAlertsForField(fieldId, user);
        return ResponseEntity.ok(ApiResponse.ok("Field alerts retrieved", alerts));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Resolve or acknowledge an alert")
    public ResponseEntity<ApiResponse<AlertDto>> resolveAlert(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        AlertDto resolved = alertService.resolveAlert(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Alert resolved successfully", resolved));
    }
}
