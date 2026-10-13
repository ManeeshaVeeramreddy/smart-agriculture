package com.samagri.repository;

import com.samagri.model.CropRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropRequirementRepository extends JpaRepository<CropRequirement, Long> {
    Optional<CropRequirement> findByCropNameIgnoreCase(String cropName);
}
