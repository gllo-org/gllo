package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExchangeRate(
        Long id,
        Currency baseCurrency,
        Currency targetCurrency,
        BigDecimal rate,
        LocalDate rateDate,
        LocalDateTime createdAt
) {
    public static ExchangeRate create(Currency baseCurrency, Currency targetCurrency,
                                       BigDecimal rate, LocalDate rateDate) {
        return new ExchangeRate(null, baseCurrency, targetCurrency, rate, rateDate, LocalDateTime.now());
    }
}
