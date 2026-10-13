package com.samagri.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RecommendationRequest {

    private Long fieldId; // optional, if user picked an existing field

    @NotNull(message = "Temperature is required")
    @DecimalMin(value = "-40.0", message = "Temperature must be at least -40°C")
    @DecimalMax(value = "70.0", message = "Temperature cannot exceed 70°C")
    private Double temperature;

    @NotNull(message = "Humidity is required")
    @DecimalMin(value = "0.0", message = "Humidity must be between 0 and 100%")
    @DecimalMax(value = "100.0", message = "Humidity must be between 0 and 100%")
    private Double humidity;

    @NotNull(message = "Soil moisture is required")
    @DecimalMin(value = "0.0", message = "Soil moisture must be between 0 and 100%")
    @DecimalMax(value = "100.0", message = "Soil moisture must be between 0 and 100%")
    private Double soilMoisture;

    @NotBlank(message = "Soil type is required")
    private String soilType;

    public RecommendationRequest() {
    }

    public RecommendationRequest(Long fieldId, Double temperature, Double humidity, Double soilMoisture, String soilType) {
        this.fieldId = fieldId;
        this.temperature = temperature;
        this.humidity = humidity;
        this.soilMoisture = soilMoisture;
        this.soilType = soilType;
    }

    public Long getFieldId() {
        return fieldId;
    }

    public void setFieldId(Long fieldId) {
        this.fieldId = fieldId;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getSoilMoisture() {
        return soilMoisture;
    }

    public void setSoilMoisture(Double soilMoisture) {
        this.soilMoisture = soilMoisture;
    }

    public String getSoilType() {
        return soilType;
    }

    public void setSoilType(String soilType) {
        this.soilType = soilType;
    }
}
