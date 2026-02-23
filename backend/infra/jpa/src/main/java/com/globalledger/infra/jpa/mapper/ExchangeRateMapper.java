package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.infra.jpa.entity.ExchangeRateEntity;
import org.springframework.stereotype.Component;

@Component
public class ExchangeRateMapper {

    public ExchangeRate toDomain(ExchangeRateEntity entity) {
        return new ExchangeRate(
                entity.getId(),
                Currency.valueOf(entity.getBaseCurrency()),
                Currency.valueOf(entity.getTargetCurrency()),
                entity.getRate(),
                entity.getRateDate(),
                entity.getCreatedAt()
        );
    }

    public ExchangeRateEntity toEntity(ExchangeRate domain) {
        return ExchangeRateEntity.builder()
                .id(domain.id())
                .baseCurrency(domain.baseCurrency().name())
                .targetCurrency(domain.targetCurrency().name())
                .rate(domain.rate())
                .rateDate(domain.rateDate())
                .createdAt(domain.createdAt())
                .build();
    }
}
