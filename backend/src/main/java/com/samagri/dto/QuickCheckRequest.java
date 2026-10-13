package com.samagri.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * "Feel test" reading for farmers without sensors or who cannot type numbers:
 * the farmer squeezes a handful of soil and picks DRY, MOIST or WET.
 */
public class QuickCheckRequest {

    @NotNull(message = "Field ID is required")
    private Long fieldId;

    @NotBlank(message = "Soil feel is required (DRY, MOIST or WET)")
    private String soilFeel;

    @DecimalMin(value = "-40.0", message = "Temperature must be at least -40°C")
    @DecimalMax(value = "70.0", message = "Temperature cannot exceed 70°C")
    private Double temperature;   // optional - taken from the weather service if the app knows it

    @DecimalMin(value = "0.0", message = "Humidity must be between 0 and 100%")
    @DecimalMax(value = "100.0", message = "Humidity must be between 0 and 100%")
    private Double humidity;      // optional

    public QuickCheckRequest() {
    }

    public Long getFieldId() {
        return fieldId;
    }

    public void setFieldId(Long fieldId) {
        this.fieldId = fieldId;
    }

    public String getSoilFeel() {
        return soilFeel;
    }

    public void setSoilFeel(String soilFeel) {
        this.soilFeel = soilFeel;
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
}
