package com.samagri.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class IrrigationStatusDto {

    private Long statusId;
    private Long fieldId;
    private String fieldName;
    private String status;
    private Double threshold;
    private Double soilMoisture;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime checkedDateTime;

    private String advice;

    public IrrigationStatusDto() {
    }

    public IrrigationStatusDto(Long statusId, Long fieldId, String fieldName, String status, Double threshold, Double soilMoisture, LocalDateTime checkedDateTime, String advice) {
        this.statusId = statusId;
        this.fieldId = fieldId;
        this.fieldName = fieldName;
        this.status = status;
        this.threshold = threshold;
        this.soilMoisture = soilMoisture;
        this.checkedDateTime = checkedDateTime;
        this.advice = advice;
    }

    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Double getSoilMoisture() {
        return soilMoisture;
    }

    public void setSoilMoisture(Double soilMoisture) {
        this.soilMoisture = soilMoisture;
    }

    public LocalDateTime getCheckedDateTime() {
        return checkedDateTime;
    }

    public void setCheckedDateTime(LocalDateTime checkedDateTime) {
        this.checkedDateTime = checkedDateTime;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }
}
