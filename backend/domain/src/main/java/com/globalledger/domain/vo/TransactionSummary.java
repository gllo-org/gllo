package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionSummary(
        LocalDate date,
        TransactionType type,
        BigDecimal amount,
        Currency currency,
        String categoryName,
        String description
) {
}
