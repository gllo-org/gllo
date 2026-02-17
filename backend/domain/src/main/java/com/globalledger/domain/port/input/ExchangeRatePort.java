package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;

import java.time.LocalDate;
import java.util.List;

public interface ExchangeRatePort {
    List<ExchangeRate> getLatest();
    ExchangeRate getLatestRate(Currency baseCurrency, Currency targetCurrency);
    void updateRates();
    List<ExchangeRate> getRatesByDate(LocalDate rateDate);
    List<ExchangeRate> getHistory(Currency baseCurrency, Currency targetCurrency,
                                    LocalDate fromDate, LocalDate toDate);
}
