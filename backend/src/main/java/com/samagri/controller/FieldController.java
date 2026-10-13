package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.FieldDto;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.FieldService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fields")
@Tag(name = "Field Management", description = "Endpoints for managing farm fields")
public class FieldController {

    private final FieldService fieldService;
    private final AuthService authService;

    public FieldController(FieldService fieldService, AuthService authService) {
        this.fieldService = fieldService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Add a new field")
    public ResponseEntity<ApiResponse<FieldDto>> createField(@Valid @RequestBody FieldDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        FieldDto created = fieldService.createField(dto, user);
        return new ResponseEntity<>(ApiResponse.ok("Field created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all fields for the authenticated user")
    public ResponseEntity<ApiResponse<List<FieldDto>>> getFields() {
        User user = authService.getCurrentAuthenticatedUser();
        List<FieldDto> fields = fieldService.getFieldsByUser(user);
        return ResponseEntity.ok(ApiResponse.ok("Fields retrieved successfully", fields));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get field details by ID")
    public ResponseEntity<ApiResponse<FieldDto>> getFieldById(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        FieldDto field = fieldService.getFieldById(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Field retrieved successfully", field));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update field by ID")
    public ResponseEntity<ApiResponse<FieldDto>> updateField(@PathVariable("id") Long id,
                                                            @Valid @RequestBody FieldDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        FieldDto updated = fieldService.updateField(id, dto, user);
        return ResponseEntity.ok(ApiResponse.ok("Field updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete field by ID")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable("id") Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        fieldService.deleteField(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Field deleted successfully"));
    }
}
