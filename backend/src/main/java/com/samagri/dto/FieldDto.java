package com.samagri.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class FieldDto {

    private Long fieldId;

    @NotBlank(message = "Field name is required")
    private String fieldName;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Area is required")
    @Positive(message = "Area must be greater than zero")
    private Double area;

    @NotBlank(message = "Soil type is required")
    private String soilType;

    private Long userId;
    private String ownerName;
    private int cropCount;
    private Double latestTemperature;
    private Double latestHumidity;
    private Double latestSoilMoisture;
    private String irrigationStatus;
    private int activeAlertCount;

    public FieldDto() {
    }

    public FieldDto(Long fieldId, String fieldName, String location, Double area, String soilType) {
        this.fieldId = fieldId;
        this.fieldName = fieldName;
        this.location = location;
        this.area = area;
        this.soilType = soilType;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public int getCropCount() {
        return cropCount;
    }

    public void setCropCount(int cropCount) {
        this.cropCount = cropCount;
    }

    public Double getLatestTemperature() {
        return latestTemperature;
    }

    public void setLatestTemperature(Double latestTemperature) {
        this.latestTemperature = latestTemperature;
    }

    public Double getLatestHumidity() {
        return latestHumidity;
    }

    public void setLatestHumidity(Double latestHumidity) {
        this.latestHumidity = latestHumidity;
    }

    public Double getLatestSoilMoisture() {
        return latestSoilMoisture;
    }

    public void setLatestSoilMoisture(Double latestSoilMoisture) {
        this.latestSoilMoisture = latestSoilMoisture;
    }

    public String getIrrigationStatus() {
        return irrigationStatus;
    }

    public void setIrrigationStatus(String irrigationStatus) {
        this.irrigationStatus = irrigationStatus;
    }

    public int getActiveAlertCount() {
        return activeAlertCount;
    }

    public void setActiveAlertCount(int activeAlertCount) {
        this.activeAlertCount = activeAlertCount;
    }
}
