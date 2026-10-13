package com.samagri.repository;

import com.samagri.model.Role;
import com.samagri.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    long countByRole(Role role);
    List<User> findByRole(Role role);
}
