package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.infra.jpa.mapper.ExchangeRateMapper;
import com.globalledger.infra.jpa.repository.ExchangeRateJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ExchangeRateRepositoryAdapter implements ExchangeRateRepositoryPort {

    private final ExchangeRateJpaRepository exchangeRateJpaRepository;
    private final ExchangeRateMapper exchangeRateMapper;

    @Override
    public ExchangeRate save(ExchangeRate exchangeRate) {
        return exchangeRateMapper.toDomain(
                exchangeRateJpaRepository.save(exchangeRateMapper.toEntity(exchangeRate)));
    }

    @Override
    public Optional<ExchangeRate> findLatestByPair(Currency baseCurrency, Currency targetCurrency) {
        return exchangeRateJpaRepository.findLatestByPair(baseCurrency.name(), targetCurrency.name())
                .map(exchangeRateMapper::toDomain);
    }

    @Override
    public List<ExchangeRate> findLatestAll() {
        return exchangeRateJpaRepository.findLatestAll().stream()
                .map(exchangeRateMapper::toDomain)
                .toList();
    }

    @Override
    public List<ExchangeRate> findByRateDate(LocalDate rateDate) {
        return exchangeRateJpaRepository.findAllByRateDate(rateDate).stream()
                .map(exchangeRateMapper::toDomain)
                .toList();
    }
}
