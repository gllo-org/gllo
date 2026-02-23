package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.infra.jpa.entity.MonthlyBudgetEntity;
import org.springframework.stereotype.Component;

@Component
public class MonthlyBudgetMapper {

    public MonthlyBudget toDomain(MonthlyBudgetEntity entity) {
        return new MonthlyBudget(
                entity.getId(),
                entity.getUserId(),
                entity.getYearMonth(),
                entity.getAmount(),
                Currency.valueOf(entity.getCurrency()),
                entity.getCreatedAt()
        );
    }

    public MonthlyBudgetEntity toEntity(MonthlyBudget domain) {
        return MonthlyBudgetEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .yearMonth(domain.yearMonth())
                .amount(domain.amount())
                .currency(domain.currency().name())
                .createdAt(domain.createdAt())
                .build();
    }
}
