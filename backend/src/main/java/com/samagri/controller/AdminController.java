package com.samagri.controller;

import com.samagri.dto.*;
import com.samagri.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Tag(name = "Administrator Module", description = "Endpoints restricted to Administrators for system management")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get overall system counts and active alert statistics")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getSystemStats() {
        AdminStatsDto stats = adminService.getSystemStats();
        return ResponseEntity.ok(ApiResponse.ok("System statistics retrieved", stats));
    }

    @GetMapping("/users")
    @Operation(summary = "List all registered users (Farmers and Admins)")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", users));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete user by ID")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable("id") Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully"));
    }

    @GetMapping("/fields")
    @Operation(summary = "List all fields across all farmers")
    public ResponseEntity<ApiResponse<List<FieldDto>>> getAllFields() {
        List<FieldDto> fields = adminService.getAllFields();
        return ResponseEntity.ok(ApiResponse.ok("All fields retrieved", fields));
    }

    @GetMapping("/crops")
    @Operation(summary = "List all crops across all fields")
    public ResponseEntity<ApiResponse<List<CropDto>>> getAllCrops() {
        List<CropDto> crops = adminService.getAllCrops();
        return ResponseEntity.ok(ApiResponse.ok("All crops retrieved", crops));
    }

    @GetMapping("/monitoring")
    @Operation(summary = "List all monitoring records in the system")
    public ResponseEntity<ApiResponse<List<MonitoringResponse>>> getAllMonitoring() {
        List<MonitoringResponse> records = adminService.getAllMonitoringRecords();
        return ResponseEntity.ok(ApiResponse.ok("All monitoring records retrieved", records));
    }

    @GetMapping("/alerts")
    @Operation(summary = "List all alerts generated in the system")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAllAlerts() {
        List<AlertDto> alerts = adminService.getAllAlerts();
        return ResponseEntity.ok(ApiResponse.ok("All alerts retrieved", alerts));
    }
}
