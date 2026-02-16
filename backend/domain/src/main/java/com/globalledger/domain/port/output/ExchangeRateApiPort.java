package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.ExchangeRateInfo;

import java.util.List;

public interface ExchangeRateApiPort {
    List<ExchangeRateInfo> fetchLatestRates(Currency baseCurrency);
}
