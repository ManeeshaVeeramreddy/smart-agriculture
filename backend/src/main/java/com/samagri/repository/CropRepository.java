package com.samagri.repository;

import com.samagri.model.Crop;
import com.samagri.model.Field;
import com.samagri.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByField(Field field);
    List<Crop> findByFieldUser(User user);
    Optional<Crop> findByCropIdAndFieldUser(Long cropId, User user);
    long countByFieldUser(User user);
}
