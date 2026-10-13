package com.samagri.service;

import com.samagri.dto.CropDto;
import com.samagri.exception.ResourceNotFoundException;
import com.samagri.model.Crop;
import com.samagri.model.Field;
import com.samagri.model.Role;
import com.samagri.model.User;
import com.samagri.repository.CropRepository;
import com.samagri.repository.FieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CropService {

    private final CropRepository cropRepository;
    private final FieldRepository fieldRepository;

    public CropService(CropRepository cropRepository, FieldRepository fieldRepository) {
        this.cropRepository = cropRepository;
        this.fieldRepository = fieldRepository;
    }

    @Transactional
    public CropDto createCrop(CropDto dto, User user) {
        Field field = fieldRepository.findById(dto.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + dto.getFieldId() + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        Crop crop = new Crop();
        crop.setCropName(dto.getCropName().trim());
        crop.setField(field);
        crop.setPlantingDate(dto.getPlantingDate());
        crop.setExpectedHarvestDate(dto.getExpectedHarvestDate());
        crop.setCropStatus(dto.getCropStatus().trim());

        Crop saved = cropRepository.save(crop);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CropDto> getCropsByUser(User user) {
        List<Crop> crops;
        if (user.getRole() == Role.ADMINISTRATOR) {
            crops = cropRepository.findAll();
        } else {
            crops = cropRepository.findByFieldUser(user);
        }
        return crops.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CropDto> getCropsByField(Long fieldId, User user) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !field.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Field not found or access denied.");
        }

        return cropRepository.findByField(field).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CropDto getCropById(Long cropId, User user) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop with ID " + cropId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !crop.getField().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Crop not found or access denied.");
        }

        return toDto(crop);
    }

    @Transactional
    public CropDto updateCrop(Long cropId, CropDto dto, User user) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop with ID " + cropId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !crop.getField().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Crop not found or access denied.");
        }

        if (dto.getFieldId() != null && !dto.getFieldId().equals(crop.getField().getFieldId())) {
            Field newField = fieldRepository.findById(dto.getFieldId())
                    .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + dto.getFieldId() + " not found."));
            if (user.getRole() != Role.ADMINISTRATOR && !newField.getUser().getUserId().equals(user.getUserId())) {
                throw new ResourceNotFoundException("Target field not found or access denied.");
            }
            crop.setField(newField);
        }

        crop.setCropName(dto.getCropName().trim());
        crop.setPlantingDate(dto.getPlantingDate());
        crop.setExpectedHarvestDate(dto.getExpectedHarvestDate());
        crop.setCropStatus(dto.getCropStatus().trim());

        Crop updated = cropRepository.save(crop);
        return toDto(updated);
    }

    @Transactional
    public void deleteCrop(Long cropId, User user) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop with ID " + cropId + " not found."));

        if (user.getRole() != Role.ADMINISTRATOR && !crop.getField().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Crop not found or access denied.");
        }

        cropRepository.delete(crop);
    }

    public CropDto toDto(Crop crop) {
        return new CropDto(
                crop.getCropId(),
                crop.getCropName(),
                crop.getField() != null ? crop.getField().getFieldId() : null,
                crop.getField() != null ? crop.getField().getFieldName() : null,
                crop.getPlantingDate(),
                crop.getExpectedHarvestDate(),
                crop.getCropStatus()
        );
    }
}
