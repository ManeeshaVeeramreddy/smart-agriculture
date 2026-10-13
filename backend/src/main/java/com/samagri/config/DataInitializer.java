package com.samagri.config;

import com.samagri.model.*;
import com.samagri.repository.*;
import com.samagri.service.AlertService;
import com.samagri.service.IrrigationService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final CropRequirementRepository cropRequirementRepository;
    private final MonitoringDataRepository monitoringDataRepository;
    private final IrrigationStatusRepository irrigationStatusRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;
    private final IrrigationService irrigationService;
    private final AlertService alertService;

    public DataInitializer(UserRepository userRepository,
                           FieldRepository fieldRepository,
                           CropRepository cropRepository,
                           CropRequirementRepository cropRequirementRepository,
                           MonitoringDataRepository monitoringDataRepository,
                           IrrigationStatusRepository irrigationStatusRepository,
                           AlertRepository alertRepository,
                           PasswordEncoder passwordEncoder,
                           IrrigationService irrigationService,
                           AlertService alertService) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.cropRepository = cropRepository;
        this.cropRequirementRepository = cropRequirementRepository;
        this.monitoringDataRepository = monitoringDataRepository;
        this.irrigationStatusRepository = irrigationStatusRepository;
        this.alertRepository = alertRepository;
        this.passwordEncoder = passwordEncoder;
        this.irrigationService = irrigationService;
        this.alertService = alertService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Seed Crop Requirements if not present
        if (cropRequirementRepository.count() == 0) {
            seedCropRequirements();
        }

        // Seed Users, Fields, Crops, and Demonstrative Monitoring Records if no users exist
        if (userRepository.count() == 0) {
            seedUsersAndOperationalData();
        }
    }

    private void seedCropRequirements() {
        cropRequirementRepository.save(new CropRequirement(null, "Rice", 20.0, 38.0, 60.0, 85.0, 50.0, 80.0, "Clay, Loamy"));
        cropRequirementRepository.save(new CropRequirement(null, "Wheat", 15.0, 25.0, 40.0, 65.0, 35.0, 60.0, "Loamy, Clay"));
        cropRequirementRepository.save(new CropRequirement(null, "Maize", 18.0, 32.0, 45.0, 75.0, 30.0, 65.0, "Loamy, Sandy"));
        cropRequirementRepository.save(new CropRequirement(null, "Tomato", 18.0, 30.0, 50.0, 70.0, 35.0, 65.0, "Loamy, Sandy"));
        cropRequirementRepository.save(new CropRequirement(null, "Groundnut", 22.0, 35.0, 40.0, 70.0, 25.0, 55.0, "Sandy, Loamy"));
    }

    private void seedUsersAndOperationalData() {
        // 1. Administrator
        User admin = new User(
                null,
                "System Administrator",
                "admin@sams.com",
                "9876543210",
                passwordEncoder.encode("admin123"),
                Role.ADMINISTRATOR
        );
        userRepository.save(admin);

        // 2. Farmer
        User farmer = new User(
                null,
                "Ramesh Kumar",
                "farmer@sams.com",
                "9123456789",
                passwordEncoder.encode("farmer123"),
                Role.FARMER
        );
        User savedFarmer = userRepository.save(farmer);

        // 3. Fields for Farmer
        Field fieldA = new Field(null, "Field A", "Amaravati", 2.5, "Loamy", savedFarmer);
        Field fieldB = new Field(null, "Field B", "Guntur", 4.0, "Clay", savedFarmer);
        Field savedFieldA = fieldRepository.save(fieldA);
        Field savedFieldB = fieldRepository.save(fieldB);

        // 4. Crops
        cropRepository.save(new Crop(null, "Rice", savedFieldA, LocalDate.now().minusDays(30), LocalDate.now().plusDays(90), "Growing"));
        cropRepository.save(new Crop(null, "Maize", savedFieldA, LocalDate.now().minusDays(15), LocalDate.now().plusDays(75), "Vegetative"));
        cropRepository.save(new Crop(null, "Wheat", savedFieldB, LocalDate.now().minusDays(45), LocalDate.now().plusDays(60), "Flowering"));
        cropRepository.save(new Crop(null, "Tomato", savedFieldB, LocalDate.now().minusDays(10), LocalDate.now().plusDays(80), "Sown"));

        // 5. Demonstrative Monitoring Records
        // Record 1: Normal Moisture (45%) on Field B -> "Moisture Level Normal"
        LocalDateTime timeNormal = LocalDateTime.now().minusDays(1);
        MonitoringData mNormal = new MonitoringData(null, savedFieldB, 26.5, 70.0, 45.0, timeNormal);
        monitoringDataRepository.save(mNormal);
        irrigationService.recordIrrigationStatus(savedFieldB, 45.0, timeNormal);

        // Record 2: Critical Low Moisture (25%) on Field A -> "Irrigation Required" + Low Soil Moisture Alert
        LocalDateTime timeLow = LocalDateTime.now().minusHours(2);
        MonitoringData mLow = new MonitoringData(null, savedFieldA, 31.0, 58.0, 25.0, timeLow);
        monitoringDataRepository.save(mLow);
        irrigationService.recordIrrigationStatus(savedFieldA, 25.0, timeLow);
        alertService.checkAndCreateAlert(savedFieldA, 25.0, timeLow);
    }
}
