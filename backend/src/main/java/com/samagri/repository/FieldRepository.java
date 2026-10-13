package com.samagri.repository;

import com.samagri.model.Field;
import com.samagri.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldRepository extends JpaRepository<Field, Long> {
    List<Field> findByUser(User user);
    Optional<Field> findByFieldIdAndUser(Long fieldId, User user);
    long countByUser(User user);
}
