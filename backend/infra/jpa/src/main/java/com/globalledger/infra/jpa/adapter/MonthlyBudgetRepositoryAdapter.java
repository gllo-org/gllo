package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.infra.jpa.mapper.MonthlyBudgetMapper;
import com.globalledger.infra.jpa.repository.MonthlyBudgetJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MonthlyBudgetRepositoryAdapter implements MonthlyBudgetRepositoryPort {

    private final MonthlyBudgetJpaRepository monthlyBudgetJpaRepository;
    private final MonthlyBudgetMapper monthlyBudgetMapper;

    @Override
    public MonthlyBudget save(MonthlyBudget budget) {
        return monthlyBudgetMapper.toDomain(
                monthlyBudgetJpaRepository.save(monthlyBudgetMapper.toEntity(budget)));
    }

    @Override
    public Optional<MonthlyBudget> findByUserIdAndYearMonth(UUID userId, YearMonth yearMonth) {
        return monthlyBudgetJpaRepository.findByUserIdAndYearMonth(userId, yearMonth)
                .map(monthlyBudgetMapper::toDomain);
    }

    @Override
    public boolean existsByUserIdAndYearMonth(UUID userId, YearMonth yearMonth) {
        return monthlyBudgetJpaRepository.existsByUserIdAndYearMonth(userId, yearMonth);
    }
}
