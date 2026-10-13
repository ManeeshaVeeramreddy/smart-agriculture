package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.IrrigationStatusDto;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.IrrigationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/irrigation")
@Tag(name = "Irrigation Module", description = "Endpoints for checking irrigation requirements based on threshold")
public class IrrigationController {

    private final IrrigationService irrigationService;
    private final AuthService authService;

    public IrrigationController(IrrigationService irrigationService, AuthService authService) {
        this.irrigationService = irrigationService;
        this.authService = authService;
    }

    @GetMapping("/{fieldId}")
    @Operation(summary = "Check irrigation status for a field based on soil moisture (<30% threshold)")
    public ResponseEntity<ApiResponse<IrrigationStatusDto>> getIrrigationStatus(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        IrrigationStatusDto status = irrigationService.getIrrigationStatusForField(fieldId, user);
        return ResponseEntity.ok(ApiResponse.ok("Irrigation status evaluated", status));
    }
}
