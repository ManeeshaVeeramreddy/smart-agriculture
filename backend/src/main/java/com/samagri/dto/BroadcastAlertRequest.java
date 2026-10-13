package com.samagri.dto;

import jakarta.validation.constraints.NotBlank;

public class BroadcastAlertRequest {

    @NotBlank(message = "Alert type is required")
    private String alertType; // e.g., WEATHER_ADVISORY, HEATWAVE_WARNING, PEST_ALERT

    @NotBlank(message = "Message is required")
    private String message;

    private Long targetFieldId; // Optional; if null, broadcast to all fields

    public BroadcastAlertRequest() {
    }

    public BroadcastAlertRequest(String alertType, String message, Long targetFieldId) {
        this.alertType = alertType;
        this.message = message;
        this.targetFieldId = targetFieldId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTargetFieldId() {
        return targetFieldId;
    }

    public void setTargetFieldId(Long targetFieldId) {
        this.targetFieldId = targetFieldId;
    }
}
