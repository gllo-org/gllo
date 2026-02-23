package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
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
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.id(),
                transaction.accountId(),
                transaction.type(),
                transaction.title(),
                transaction.amount(),
                transaction.currency(),
                transaction.categoryId(),
                transaction.tripId(),
                transaction.transactionDate(),
                transaction.note(),
                transaction.systemExchangeRate(),
                transaction.customExchangeRate(),
                transaction.customConvertedAmount(),
                transaction.createdAt()
        );
    }
}
