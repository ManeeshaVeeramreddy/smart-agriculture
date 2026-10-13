package com.samagri.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fields")
public class Field {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fieldId;

    @Column(nullable = false, length = 100)
    private String fieldName;

    @Column(nullable = false, length = 150)
    private String location;

    @Column(nullable = false)
    private Double area; // in acres or hectares

    @Column(nullable = false, length = 50)
    private String soilType; // e.g., Loamy, Clay, Sandy, Black, Red, Silty

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Crop> crops = new ArrayList<>();

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<MonitoringData> monitoringDataList = new ArrayList<>();

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Alert> alerts = new ArrayList<>();

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<IrrigationStatus> irrigationStatuses = new ArrayList<>();

    public Field() {
    }

    public Field(Long fieldId, String fieldName, String location, Double area, String soilType, User user) {
        this.fieldId = fieldId;
        this.fieldName = fieldName;
        this.location = location;
        this.area = area;
        this.soilType = soilType;
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Crop> getCrops() {
        return crops;
    }

    public void setCrops(List<Crop> crops) {
        this.crops = crops;
    }

    public List<MonitoringData> getMonitoringDataList() {
        return monitoringDataList;
    }

    public void setMonitoringDataList(List<MonitoringData> monitoringDataList) {
        this.monitoringDataList = monitoringDataList;
    }

    public List<Alert> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<Alert> alerts) {
        this.alerts = alerts;
    }

    public List<IrrigationStatus> getIrrigationStatuses() {
        return irrigationStatuses;
    }

    public void setIrrigationStatuses(List<IrrigationStatus> irrigationStatuses) {
        this.irrigationStatuses = irrigationStatuses;
    }
}
