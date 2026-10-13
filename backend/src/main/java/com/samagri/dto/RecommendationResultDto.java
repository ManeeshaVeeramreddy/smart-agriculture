package com.samagri.dto;

public class RecommendationResultDto {

    private String cropName;
    private int suitabilityScore; // percentage (e.g. 90%)
    private boolean isSuitable;
    private String reason;
    private Double minimumTemperature;
    private Double maximumTemperature;
    private Double minimumHumidity;
    private Double maximumHumidity;
    private Double minimumSoilMoisture;
    private Double maximumSoilMoisture;
    private String suitableSoilType;

    public RecommendationResultDto() {
    }

    public RecommendationResultDto(String cropName, int suitabilityScore, boolean isSuitable, String reason,
                                   Double minimumTemperature, Double maximumTemperature,
                                   Double minimumHumidity, Double maximumHumidity,
                                   Double minimumSoilMoisture, Double maximumSoilMoisture,
                                   String suitableSoilType) {
        this.cropName = cropName;
        this.suitabilityScore = suitabilityScore;
        this.isSuitable = isSuitable;
        this.reason = reason;
        this.minimumTemperature = minimumTemperature;
        this.maximumTemperature = maximumTemperature;
        this.minimumHumidity = minimumHumidity;
        this.maximumHumidity = maximumHumidity;
        this.minimumSoilMoisture = minimumSoilMoisture;
        this.maximumSoilMoisture = maximumSoilMoisture;
        this.suitableSoilType = suitableSoilType;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public int getSuitabilityScore() {
        return suitabilityScore;
    }

    public void setSuitabilityScore(int suitabilityScore) {
        this.suitabilityScore = suitabilityScore;
    }

    public boolean isSuitable() {
        return isSuitable;
    }

    public void setSuitable(boolean suitable) {
        isSuitable = suitable;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
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
