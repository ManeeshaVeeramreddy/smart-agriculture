package com.samagri.repository;

import com.samagri.model.Field;
import com.samagri.model.MonitoringData;
import com.samagri.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitoringDataRepository extends JpaRepository<MonitoringData, Long> {
    List<MonitoringData> findByFieldOrderByDateTimeDesc(Field field);
    Optional<MonitoringData> findFirstByFieldOrderByDateTimeDesc(Field field);
    List<MonitoringData> findByFieldUserOrderByDateTimeDesc(User user);
    Optional<MonitoringData> findFirstByFieldUserOrderByDateTimeDesc(User user);
    List<MonitoringData> findAllByOrderByDateTimeDesc();
}
