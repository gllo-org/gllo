package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.MonthlyBudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetJpaRepository extends JpaRepository<MonthlyBudgetEntity, Long> {
    Optional<MonthlyBudgetEntity> findByUserIdAndYearMonth(UUID userId, YearMonth yearMonth);
    boolean existsByUserIdAndYearMonth(UUID userId, YearMonth yearMonth);
}
