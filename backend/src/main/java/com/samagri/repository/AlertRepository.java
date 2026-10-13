package com.samagri.repository;

import com.samagri.model.Alert;
import com.samagri.model.Field;
import com.samagri.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByFieldOrderByCreatedDateTimeDesc(Field field);
    List<Alert> findByFieldUserOrderByCreatedDateTimeDesc(User user);
    List<Alert> findByFieldUserAndStatusOrderByCreatedDateTimeDesc(User user, String status);
    long countByFieldUserAndStatus(User user, String status);
    long countByStatus(String status);
    List<Alert> findAllByOrderByCreatedDateTimeDesc();

    @Query("SELECT a FROM Alert a WHERE a.field.user = :user AND UPPER(a.status) = UPPER(:status) ORDER BY a.createdDateTime DESC")
    List<Alert> findByUserOrBroadcastAndStatus(@Param("user") User user, @Param("status") String status);
}

