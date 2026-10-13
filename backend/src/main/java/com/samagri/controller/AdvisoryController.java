package com.samagri.controller;

import com.samagri.dto.AdvisoryDto;
import com.samagri.dto.ApiResponse;
import com.samagri.model.User;
import com.samagri.service.AdvisoryService;
import com.samagri.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/advisory")
@Tag(name = "Farmer Advisory", description = "Plain-language, action-oriented advice for each field (what to do today)")
public class AdvisoryController {

    private final AdvisoryService advisoryService;
    private final AuthService authService;

    public AdvisoryController(AdvisoryService advisoryService, AuthService authService) {
        this.advisoryService = advisoryService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Advice for every field of the current farmer (water now? too wet? heat? disease risk? harvest?)")
    public ResponseEntity<ApiResponse<List<AdvisoryDto>>> getAdvisory() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.ok("Advisory generated", advisoryService.getAdvisoryForUser(user)));
    }

    @GetMapping("/{fieldId}")
    @Operation(summary = "Advice for one field")
    public ResponseEntity<ApiResponse<AdvisoryDto>> getAdvisoryForField(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.ok("Advisory generated", advisoryService.getAdvisoryForField(fieldId, user)));
    }
}
