package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

public record MonthlyBudget(
        Long id,
        UUID userId,
        YearMonth yearMonth,
        BigDecimal amount,
        Currency currency,
        LocalDateTime createdAt
) {
    public static MonthlyBudget create(UUID userId, YearMonth yearMonth,
                                        BigDecimal amount, Currency currency) {
        return new MonthlyBudget(null, userId, yearMonth, amount, currency, LocalDateTime.now());
    }

    public MonthlyBudget update(BigDecimal newAmount) {
        return new MonthlyBudget(id, userId, yearMonth, newAmount, currency, createdAt);
    }
}
