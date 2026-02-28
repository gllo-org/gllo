package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record Trip(
        Long id,
        UUID userId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal budget,
        Currency budgetCurrency,
        boolean active,
        LocalDateTime createdAt
) {
    public static Trip create(UUID userId, String name, LocalDate startDate,
                               LocalDate endDate, BigDecimal budget, Currency budgetCurrency) {
        return new Trip(null, userId, name, startDate, endDate, budget, budgetCurrency,
                true, LocalDateTime.now());
    }

    public Trip complete(LocalDate completionDate) {
        return new Trip(id, userId, name, startDate, completionDate, budget,
                budgetCurrency, false, createdAt);
    }

    public Trip withUpdated(String newName, LocalDate newStartDate, LocalDate newEndDate,
                            BigDecimal newBudget, Currency newBudgetCurrency) {
        return new Trip(
                id, userId,
                newName != null ? newName : name,
                newStartDate != null ? newStartDate : startDate,
                newEndDate != null ? newEndDate : endDate,
                newBudget != null ? newBudget : budget,
                newBudgetCurrency != null ? newBudgetCurrency : budgetCurrency,
                active, createdAt
        );
    }
}
