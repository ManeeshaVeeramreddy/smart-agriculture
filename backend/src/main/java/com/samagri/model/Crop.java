package com.samagri.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cropId;

    @Column(nullable = false, length = 100)
    private String cropName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    @JsonIgnore
    private Field field;

    @Column(nullable = false)
    private LocalDate plantingDate;

    @Column
    private LocalDate expectedHarvestDate;

    @Column(nullable = false, length = 50)
    private String cropStatus; // e.g., "Sown", "Growing", "Flowering", "Harvested"

    public Crop() {
    }

    public Crop(Long cropId, String cropName, Field field, LocalDate plantingDate, LocalDate expectedHarvestDate, String cropStatus) {
        this.cropId = cropId;
        this.cropName = cropName;
        this.field = field;
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

    public Field getField() {
        return field;
    }

    public void setField(Field field) {
        this.field = field;
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
