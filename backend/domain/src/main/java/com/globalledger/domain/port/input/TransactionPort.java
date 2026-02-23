package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionPort {
    Transaction create(UUID userId, Long accountId, TransactionType type, String title,
                       BigDecimal amount, Currency currency, Long categoryId,
                       Long tripId, LocalDate transactionDate, String note,
                       BigDecimal customExchangeRate, BigDecimal customConvertedAmount);

    Transaction update(UUID userId, Long transactionId, String title, BigDecimal amount,
                       Long categoryId, Long tripId, LocalDate transactionDate,
                       String note, BigDecimal customExchangeRate, BigDecimal customConvertedAmount);

    List<Transaction> getList(UUID userId, Integer year, Integer month,
                               Long accountId, Long categoryId);

    Transaction getById(UUID userId, Long transactionId);

    void delete(UUID userId, Long transactionId);
}
