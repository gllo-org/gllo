package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateInfo(
        Currency baseCurrency,
        Currency targetCurrency,
        BigDecimal rate,
        LocalDate rateDate
) {
}
