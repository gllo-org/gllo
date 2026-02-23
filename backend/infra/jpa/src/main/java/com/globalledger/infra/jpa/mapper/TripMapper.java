package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Trip;
import com.globalledger.infra.jpa.entity.TripEntity;
import org.springframework.stereotype.Component;

@Component
public class TripMapper {

    public Trip toDomain(TripEntity entity) {
        return new Trip(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getBudget(),
                entity.getBudgetCurrency() != null ? Currency.valueOf(entity.getBudgetCurrency()) : null,
                entity.isActive(),
                entity.getCreatedAt()
        );
    }

    public TripEntity toEntity(Trip domain) {
        return TripEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .name(domain.name())
                .startDate(domain.startDate())
                .endDate(domain.endDate())
                .budget(domain.budget())
                .budgetCurrency(domain.budgetCurrency() != null ? domain.budgetCurrency().name() : null)
                .active(domain.active())
                .createdAt(domain.createdAt())
                .build();
    }
}
