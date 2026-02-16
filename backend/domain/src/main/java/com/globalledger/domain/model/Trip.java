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
}
