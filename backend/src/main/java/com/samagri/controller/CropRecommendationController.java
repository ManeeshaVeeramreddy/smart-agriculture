package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.RecommendationRequest;
import com.samagri.dto.RecommendationResultDto;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.CropRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@Tag(name = "Crop Recommendation", description = "Endpoints for rule-based crop suitability recommendations")
public class CropRecommendationController {

    private final CropRecommendationService recommendationService;
    private final AuthService authService;

    public CropRecommendationController(CropRecommendationService recommendationService, AuthService authService) {
        this.recommendationService = recommendationService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Get crop recommendations based on manual input conditions")
    public ResponseEntity<ApiResponse<List<RecommendationResultDto>>> getRecommendations(@Valid @RequestBody RecommendationRequest request) {
        List<RecommendationResultDto> results = recommendationService.getRecommendations(request);
        return ResponseEntity.ok(ApiResponse.ok("Recommendations calculated successfully", results));
    }

    @GetMapping("/{fieldId}")
    @Operation(summary = "Get crop recommendations automatically based on latest field monitoring data and soil type")
    public ResponseEntity<ApiResponse<List<RecommendationResultDto>>> getRecommendationsForField(@PathVariable("fieldId") Long fieldId) {
        User user = authService.getCurrentAuthenticatedUser();
        List<RecommendationResultDto> results = recommendationService.getRecommendationsForField(fieldId, user);
        return ResponseEntity.ok(ApiResponse.ok("Field recommendations calculated successfully", results));
    }
}
