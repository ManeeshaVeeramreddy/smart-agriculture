package com.samagri.repository;

import com.samagri.model.Field;
import com.samagri.model.IrrigationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IrrigationStatusRepository extends JpaRepository<IrrigationStatus, Long> {
    Optional<IrrigationStatus> findFirstByFieldOrderByCheckedDateTimeDesc(Field field);
    List<IrrigationStatus> findByFieldOrderByCheckedDateTimeDesc(Field field);
}
