package com.samagri.model;

import jakarta.persistence.*;

@Entity
@Table(name = "crop_requirements")
public class CropRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requirementId;

    @Column(nullable = false, unique = true, length = 100)
    private String cropName;

    @Column(nullable = false)
    private Double minimumTemperature;

    @Column(nullable = false)
    private Double maximumTemperature;

    @Column(nullable = false)
    private Double minimumHumidity;

    @Column(nullable = false)
    private Double maximumHumidity;

    @Column(nullable = false)
    private Double minimumSoilMoisture;

    @Column(nullable = false)
    private Double maximumSoilMoisture;

    @Column(nullable = false, length = 100)
    private String suitableSoilType; // e.g., "Clay, Loamy"

    public CropRequirement() {
    }

    public CropRequirement(Long requirementId, String cropName, Double minimumTemperature, Double maximumTemperature,
                           Double minimumHumidity, Double maximumHumidity, Double minimumSoilMoisture,
                           Double maximumSoilMoisture, String suitableSoilType) {
        this.requirementId = requirementId;
        this.cropName = cropName;
        this.minimumTemperature = minimumTemperature;
        this.maximumTemperature = maximumTemperature;
        this.minimumHumidity = minimumHumidity;
        this.maximumHumidity = maximumHumidity;
        this.minimumSoilMoisture = minimumSoilMoisture;
        this.maximumSoilMoisture = maximumSoilMoisture;
        this.suitableSoilType = suitableSoilType;
    }

    public Long getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Long requirementId) {
        this.requirementId = requirementId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public Double getMinimumTemperature() {
        return minimumTemperature;
    }

    public void setMinimumTemperature(Double minimumTemperature) {
        this.minimumTemperature = minimumTemperature;
    }

    public Double getMaximumTemperature() {
        return maximumTemperature;
    }

    public void setMaximumTemperature(Double maximumTemperature) {
        this.maximumTemperature = maximumTemperature;
    }

    public Double getMinimumHumidity() {
        return minimumHumidity;
    }

    public void setMinimumHumidity(Double minimumHumidity) {
        this.minimumHumidity = minimumHumidity;
    }

    public Double getMaximumHumidity() {
        return maximumHumidity;
    }

    public void setMaximumHumidity(Double maximumHumidity) {
        this.maximumHumidity = maximumHumidity;
    }

    public Double getMinimumSoilMoisture() {
        return minimumSoilMoisture;
    }

    public void setMinimumSoilMoisture(Double minimumSoilMoisture) {
        this.minimumSoilMoisture = minimumSoilMoisture;
    }

    public Double getMaximumSoilMoisture() {
        return maximumSoilMoisture;
    }

    public void setMaximumSoilMoisture(Double maximumSoilMoisture) {
        this.maximumSoilMoisture = maximumSoilMoisture;
    }

    public String getSuitableSoilType() {
        return suitableSoilType;
    }

    public void setSuitableSoilType(String suitableSoilType) {
        this.suitableSoilType = suitableSoilType;
    }
}
