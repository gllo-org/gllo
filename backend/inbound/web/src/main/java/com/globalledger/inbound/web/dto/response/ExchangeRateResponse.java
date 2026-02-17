package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateResponse(
        Long id,
        Currency baseCurrency,
        Currency targetCurrency,
        BigDecimal rate,
        LocalDate rateDate
) {
    public static ExchangeRateResponse from(ExchangeRate exchangeRate) {
        return new ExchangeRateResponse(
                exchangeRate.id(),
                exchangeRate.baseCurrency(),
                exchangeRate.targetCurrency(),
                exchangeRate.rate(),
                exchangeRate.rateDate()
        );
    }
}
