package com.samagri.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class MonitoringResponse {

    private Long monitoringId;
    private Long fieldId;
    private String fieldName;
    private Double temperature;
    private Double humidity;
    private Double soilMoisture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateTime;

    private String irrigationStatus;
    private boolean alertGenerated;
    private String alertMessage;

    public MonitoringResponse() {
    }

    public MonitoringResponse(Long monitoringId, Long fieldId, String fieldName, Double temperature,
                              Double humidity, Double soilMoisture, LocalDateTime dateTime,
                              String irrigationStatus, boolean alertGenerated, String alertMessage) {
        this.monitoringId = monitoringId;
        this.fieldId = fieldId;
        this.fieldName = fieldName;
        this.temperature = temperature;
        this.humidity = humidity;
        this.soilMoisture = soilMoisture;
        this.dateTime = dateTime;
        this.irrigationStatus = irrigationStatus;
        this.alertGenerated = alertGenerated;
        this.alertMessage = alertMessage;
    }

    public Long getMonitoringId() {
        return monitoringId;
    }

    public void setMonitoringId(Long monitoringId) {
        this.monitoringId = monitoringId;
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

    public String getIrrigationStatus() {
        return irrigationStatus;
    }

    public void setIrrigationStatus(String irrigationStatus) {
        this.irrigationStatus = irrigationStatus;
    }

    public boolean isAlertGenerated() {
        return alertGenerated;
    }

    public void setAlertGenerated(boolean alertGenerated) {
        this.alertGenerated = alertGenerated;
    }

    public String getAlertMessage() {
        return alertMessage;
    }

    public void setAlertMessage(String alertMessage) {
        this.alertMessage = alertMessage;
    }
}
