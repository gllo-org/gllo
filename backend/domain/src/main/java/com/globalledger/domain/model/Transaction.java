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
        String title,
        BigDecimal amount,
        Currency currency,
        Long categoryId,
        Long tripId,
        LocalDate transactionDate,
        String note,
        BigDecimal systemExchangeRate,
        BigDecimal customExchangeRate,
        BigDecimal customConvertedAmount,
        LocalDateTime createdAt
) {
    public static Transaction create(UUID userId, Long accountId, TransactionType type,
                                      String title, BigDecimal amount, Currency currency,
                                      Long categoryId, Long tripId, LocalDate transactionDate,
                                      String note, BigDecimal systemExchangeRate,
                                      BigDecimal customExchangeRate, BigDecimal customConvertedAmount) {
        return new Transaction(null, userId, accountId, type, title, amount, currency,
                categoryId, tripId, transactionDate, note, systemExchangeRate,
                customExchangeRate, customConvertedAmount, LocalDateTime.now());
    }
}
