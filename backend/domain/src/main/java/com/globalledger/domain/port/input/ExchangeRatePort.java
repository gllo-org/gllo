package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;

import java.util.List;

public interface ExchangeRatePort {
    List<ExchangeRate> getLatest();
    ExchangeRate getLatestRate(Currency baseCurrency, Currency targetCurrency);
    void updateRates();
}
