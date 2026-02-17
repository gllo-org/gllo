package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.UserProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileJpaRepository extends JpaRepository<UserProfileEntity, Long> {
    Optional<UserProfileEntity> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
