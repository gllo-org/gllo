package com.globalledger.domain.port.output;

import com.globalledger.domain.model.MonthlyBudget;

import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetRepositoryPort {
    MonthlyBudget save(MonthlyBudget budget);
    Optional<MonthlyBudget> findByUserIdAndYearMonth(UUID userId, YearMonth yearMonth);
    boolean existsByUserIdAndYearMonth(UUID userId, YearMonth yearMonth);
}
