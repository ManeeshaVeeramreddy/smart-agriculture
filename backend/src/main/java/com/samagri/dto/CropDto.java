package com.samagri.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CropDto {

    private Long cropId;

    @NotBlank(message = "Crop name is required")
    private String cropName;

    @NotNull(message = "Field ID is required")
    private Long fieldId;

    private String fieldName;

    @NotNull(message = "Planting date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate plantingDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expectedHarvestDate;

    @NotBlank(message = "Crop status is required")
    private String cropStatus;

    public CropDto() {
    }

    public CropDto(Long cropId, String cropName, Long fieldId, String fieldName, LocalDate plantingDate, LocalDate expectedHarvestDate, String cropStatus) {
        this.cropId = cropId;
        this.cropName = cropName;
        this.fieldId = fieldId;
        this.fieldName = fieldName;
        this.plantingDate = plantingDate;
        this.expectedHarvestDate = expectedHarvestDate;
        this.cropStatus = cropStatus;
    }

    public Long getCropId() {
        return cropId;
    }

    public void setCropId(Long cropId) {
        this.cropId = cropId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
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

    public LocalDate getPlantingDate() {
        return plantingDate;
    }

    public void setPlantingDate(LocalDate plantingDate) {
        this.plantingDate = plantingDate;
    }

    public LocalDate getExpectedHarvestDate() {
        return expectedHarvestDate;
    }

    public void setExpectedHarvestDate(LocalDate expectedHarvestDate) {
        this.expectedHarvestDate = expectedHarvestDate;
    }

    public String getCropStatus() {
        return cropStatus;
    }

    public void setCropStatus(String cropStatus) {
        this.cropStatus = cropStatus;
    }
}
