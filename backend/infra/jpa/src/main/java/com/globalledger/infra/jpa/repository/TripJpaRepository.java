package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.TripEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripJpaRepository extends JpaRepository<TripEntity, Long> {
    Optional<TripEntity> findByIdAndUserId(Long id, UUID userId);
    List<TripEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
