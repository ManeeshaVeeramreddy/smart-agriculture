package com.samagri.controller;

import com.samagri.dto.ApiResponse;
import com.samagri.dto.VoiceQueryRequest;
import com.samagri.dto.VoiceQueryResponse;
import com.samagri.model.User;
import com.samagri.service.AuthService;
import com.samagri.service.VoiceAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/voice")
@Tag(name = "Voice Assistant Module", description = "Endpoints for bilingual speech and natural language interaction")
public class VoiceAssistantController {

    private final VoiceAssistantService voiceAssistantService;
    private final AuthService authService;

    public VoiceAssistantController(VoiceAssistantService voiceAssistantService, AuthService authService) {
        this.voiceAssistantService = voiceAssistantService;
        this.authService = authService;
    }

    @PostMapping("/process")
    @Operation(summary = "Process spoken or text query in English or Telugu and return structured guidance")
    public ResponseEntity<ApiResponse<VoiceQueryResponse>> processVoiceQuery(@Valid @RequestBody VoiceQueryRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        VoiceQueryResponse response = voiceAssistantService.processVoiceQuery(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Voice query processed successfully", response));
    }

    @GetMapping("/commands")
    @Operation(summary = "Get list of sample commands and queries supported by the Voice Assistant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportedCommands(
            @RequestParam(value = "lang", defaultValue = "en") String lang) {
        Map<String, Object> commands = voiceAssistantService.getSupportedCommands(lang);
        return ResponseEntity.ok(ApiResponse.ok("Supported voice commands retrieved", commands));
    }

    @GetMapping(value = "/tts", produces = "audio/mpeg")
    @Operation(summary = "Stream natural female speech audio for Telugu or English")
    public ResponseEntity<byte[]> getSpeechAudio(
            @RequestParam("text") String text,
            @RequestParam(value = "lang", defaultValue = "te") String lang) {
        byte[] audioData = voiceAssistantService.synthesizeSpeechAudio(text, lang);
        if (audioData == null || audioData.length == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .body(audioData);
    }
}
