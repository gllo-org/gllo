package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.port.output.RecurringRuleRepositoryPort;
import com.globalledger.infra.jpa.mapper.RecurringRuleMapper;
import com.globalledger.infra.jpa.repository.RecurringRuleJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RecurringRuleRepositoryAdapter implements RecurringRuleRepositoryPort {

    private final RecurringRuleJpaRepository recurringRuleJpaRepository;
    private final RecurringRuleMapper recurringRuleMapper;

    @Override
    public RecurringRule save(RecurringRule rule) {
        return recurringRuleMapper.toDomain(
                recurringRuleJpaRepository.save(recurringRuleMapper.toEntity(rule)));
    }

    @Override
    public Optional<RecurringRule> findByIdAndUserId(Long id, UUID userId) {
        return recurringRuleJpaRepository.findByIdAndUserId(id, userId)
                .map(recurringRuleMapper::toDomain);
    }

    @Override
    public List<RecurringRule> findAllByUserId(UUID userId) {
        return recurringRuleJpaRepository.findAllByUserId(userId).stream()
                .map(recurringRuleMapper::toDomain)
                .toList();
    }

    @Override
    public List<RecurringRule> findDueRules(LocalDate date) {
        return recurringRuleJpaRepository.findAllByNextExecutionDateLessThanEqual(date).stream()
                .map(recurringRuleMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        recurringRuleJpaRepository.deleteById(id);
    }
}
