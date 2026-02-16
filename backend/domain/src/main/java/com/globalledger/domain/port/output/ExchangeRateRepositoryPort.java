package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExchangeRateRepositoryPort {
    ExchangeRate save(ExchangeRate exchangeRate);
    Optional<ExchangeRate> findLatestByPair(Currency baseCurrency, Currency targetCurrency);
    List<ExchangeRate> findLatestAll();
    List<ExchangeRate> findByRateDate(LocalDate rateDate);
}
