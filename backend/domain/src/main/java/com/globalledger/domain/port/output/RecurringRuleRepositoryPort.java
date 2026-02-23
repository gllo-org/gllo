package com.globalledger.domain.port.output;

import com.globalledger.domain.model.RecurringRule;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringRuleRepositoryPort {
    RecurringRule save(RecurringRule rule);
    Optional<RecurringRule> findByIdAndUserId(Long id, UUID userId);
    List<RecurringRule> findAllByUserId(UUID userId);
    List<RecurringRule> findDueRules(LocalDate date);
    void deleteById(Long id);
}
