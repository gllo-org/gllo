package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.RecurringRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringRuleJpaRepository extends JpaRepository<RecurringRuleEntity, Long> {
    Optional<RecurringRuleEntity> findByIdAndUserId(Long id, UUID userId);
    List<RecurringRuleEntity> findAllByUserId(UUID userId);
    List<RecurringRuleEntity> findAllByNextExecutionDateLessThanEqual(LocalDate date);
}
