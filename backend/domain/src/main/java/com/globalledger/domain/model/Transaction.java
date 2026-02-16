package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record Transaction(
        Long id,
        UUID userId,
        Long accountId,
        TransactionType type,
        BigDecimal amount,
        Currency currency,
        Long categoryId,
        Long tripId,
        LocalDate transactionDate,
        String note,
        LocalDateTime createdAt
) {
    public static Transaction create(UUID userId, Long accountId, TransactionType type,
                                      BigDecimal amount, Currency currency,
                                      Long categoryId, Long tripId,
                                      LocalDate transactionDate, String note) {
        return new Transaction(null, userId, accountId, type, amount, currency,
                categoryId, tripId, transactionDate, note, LocalDateTime.now());
    }
}
