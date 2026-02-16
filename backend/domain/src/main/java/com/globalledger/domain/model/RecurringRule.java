package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RecurringRule(
        Long id,
        UUID userId,
        String name,
        TransactionType type,
        BigDecimal amount,
        Currency currency,
        Long accountId,
        Long categoryId,
        RecurringFrequency frequency,
        Integer dayOfMonth,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextExecutionDate,
        LocalDateTime createdAt
) {
    public RecurringRule advanceNextExecutionDate(LocalDate nextDate) {
        return new RecurringRule(id, userId, name, type, amount, currency,
                accountId, categoryId, frequency, dayOfMonth,
                startDate, endDate, nextDate, createdAt);
    }
}
