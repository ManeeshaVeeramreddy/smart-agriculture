package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.CropDto;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.CropService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
@Tag(name = "Crop Management", description = "Endpoints for managing crops in fields")
public class CropController {

    private final CropService cropService;
    private final AuthService authService;

    public CropController(CropService cropService, AuthService authService) {
        this.cropService = cropService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Add a new crop to a field")
    public ResponseEntity<ApiResponse<CropDto>> createCrop(@Valid @RequestBody CropDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        CropDto created = cropService.createCrop(dto, user);
        return new ResponseEntity<>(ApiResponse.ok("Crop created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get crops (optionally filter by fieldId)")
    public ResponseEntity<ApiResponse<List<CropDto>>> getCrops(@RequestParam(name = "fieldId", required = false) Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        List<CropDto> crops;
        if (fieldId != null) {
            crops = cropService.getCropsByField(fieldId, user);
        } else {
            crops = cropService.getCropsByUser(user);
        }
        return ResponseEntity.ok(ApiResponse.ok("Crops retrieved successfully", crops));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get crop details by ID")
    public ResponseEntity<ApiResponse<CropDto>> getCropById(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        CropDto crop = cropService.getCropById(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Crop retrieved successfully", crop));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update crop details by ID")
    public ResponseEntity<ApiResponse<CropDto>> updateCrop(@PathVariable("id") Long id,
                                                           @Valid @RequestBody CropDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        CropDto updated = cropService.updateCrop(id, dto, user);
        return ResponseEntity.ok(ApiResponse.ok("Crop updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete crop by ID")
    public ResponseEntity<ApiResponse<Void>> deleteCrop(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        cropService.deleteCrop(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Crop deleted successfully"));
    }
}
