package com.globalledger.application.usecase.exchangerate;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.port.input.ExchangeRatePort;
import com.globalledger.domain.port.output.ExchangeRateApiPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.vo.ExchangeRateInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ExchangeRateUseCaseImpl implements ExchangeRatePort {

    private final ExchangeRateRepositoryPort exchangeRateRepository;
    private final ExchangeRateApiPort exchangeRateApiPort;

    @Override
    @Cacheable(value = "exchangeRates", key = "'latest'")
    @Transactional(readOnly = true)
    public List<ExchangeRate> getLatest() {
        return exchangeRateRepository.findLatestAll();
    }

    @Override
    @Cacheable(value = "exchangeRates", key = "#baseCurrency + '_' + #targetCurrency")
    @Transactional(readOnly = true)
    public ExchangeRate getLatestRate(Currency baseCurrency, Currency targetCurrency) {
        return exchangeRateRepository.findLatestByPair(baseCurrency, targetCurrency)
                .orElse(null);
    }

    @Override
    @CacheEvict(value = "exchangeRates", allEntries = true)
    public void updateRates() {
        log.info("Starting exchange rate update...");

        for (Currency baseCurrency : Currency.values()) {
            try {
                List<ExchangeRateInfo> rateInfos = exchangeRateApiPort.fetchLatestRates(baseCurrency);

                for (ExchangeRateInfo info : rateInfos) {
                    ExchangeRate exchangeRate = ExchangeRate.create(
                            info.baseCurrency(),
                            info.targetCurrency(),
                            info.rate(),
                            info.rateDate()
                    );
                    exchangeRateRepository.save(exchangeRate);
                }

                log.info("Updated {} exchange rates for {}", rateInfos.size(), baseCurrency);
            } catch (Exception e) {
                log.error("Failed to update exchange rates for {}: {}", baseCurrency, e.getMessage());
            }
        }

        log.info("Exchange rate update completed");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeRate> getRatesByDate(LocalDate rateDate) {
        return exchangeRateRepository.findByRateDate(rateDate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExchangeRate> getHistory(Currency baseCurrency, Currency targetCurrency,
                                          LocalDate fromDate, LocalDate toDate) {
        return exchangeRateRepository.findByPairAndDateRange(baseCurrency, targetCurrency, fromDate, toDate);
    }
}
