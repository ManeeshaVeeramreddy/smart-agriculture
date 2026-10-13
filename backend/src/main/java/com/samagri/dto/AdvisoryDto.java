package com.samagri.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Per-field "what should I do today?" summary for a farmer. */
public class AdvisoryDto {

    private Long fieldId;
    private String fieldName;
    private String location;
    private Double area;
    private String soilType;
    private String status;            // URGENT, WATCH, GOOD, NO_DATA
    private Double soilMoisture;
    private Double temperature;
    private Double humidity;
    private LocalDateTime lastReading;
    private List<String> crops = new ArrayList<>();
    private List<AdviceItemDto> advice = new ArrayList<>();

    public AdvisoryDto() {
    }

    public Long getFieldId() {
        return fieldId;
    }

    public void setFieldId(Long fieldId) {
        this.fieldId = fieldId;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getArea() {
        return area;
    }

    public void setArea(Double area) {
        this.area = area;
    }

    public String getSoilType() {
        return soilType;
    }

    public void setSoilType(String soilType) {
        this.soilType = soilType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getSoilMoisture() {
        return soilMoisture;
    }

    public void setSoilMoisture(Double soilMoisture) {
        this.soilMoisture = soilMoisture;
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

    public LocalDateTime getLastReading() {
        return lastReading;
    }

    public void setLastReading(LocalDateTime lastReading) {
        this.lastReading = lastReading;
    }

    public List<String> getCrops() {
        return crops;
    }

    public void setCrops(List<String> crops) {
        this.crops = crops;
    }

    public List<AdviceItemDto> getAdvice() {
        return advice;
    }

    public void setAdvice(List<AdviceItemDto> advice) {
        this.advice = advice;
    }
}
