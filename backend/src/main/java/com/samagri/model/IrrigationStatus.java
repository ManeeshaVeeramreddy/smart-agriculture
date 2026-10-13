package com.samagri.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "irrigation_statuses")
public class IrrigationStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statusId;

    @Column(nullable = false, length = 60)
    private String status; // "Irrigation Required" or "Moisture Level Normal"

    @Column(nullable = false)
    private Double threshold; // 30.0

    @Column(nullable = false)
    private Double soilMoisture;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime checkedDateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    @JsonIgnore
    private Field field;

    public IrrigationStatus() {
    }

    public IrrigationStatus(Long statusId, String status, Double threshold, Double soilMoisture, LocalDateTime checkedDateTime, Field field) {
        this.statusId = statusId;
        this.status = status;
        this.threshold = threshold;
        this.soilMoisture = soilMoisture;
        this.checkedDateTime = checkedDateTime;
        this.field = field;
    }

    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
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

    public Field getField() {
        return field;
    }

    public void setField(Field field) {
        this.field = field;
    }
}
