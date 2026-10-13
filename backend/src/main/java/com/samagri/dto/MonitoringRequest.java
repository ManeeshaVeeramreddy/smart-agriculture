package com.samagri.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class MonitoringRequest {

    @NotNull(message = "Field ID is required")
    private Long fieldId;

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

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateTime;

    public MonitoringRequest() {
    }

    public MonitoringRequest(Long fieldId, Double temperature, Double humidity, Double soilMoisture, LocalDateTime dateTime) {
        this.fieldId = fieldId;
        this.temperature = temperature;
        this.humidity = humidity;
        this.soilMoisture = soilMoisture;
        this.dateTime = dateTime;
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

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }
}
