package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.infra.jpa.entity.RecurringRuleEntity;
import org.springframework.stereotype.Component;

@Component
public class RecurringRuleMapper {

    public RecurringRule toDomain(RecurringRuleEntity entity) {
        return new RecurringRule(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                entity.getTitle(),
                TransactionType.valueOf(entity.getType()),
                entity.getAmount(),
                Currency.valueOf(entity.getCurrency()),
                entity.getAccountId(),
                entity.getCategoryId(),
                RecurringFrequency.valueOf(entity.getFrequency()),
                entity.getDayOfMonth(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getNextExecutionDate(),
                entity.getActive(),
                entity.getNotifyDaysBefore(),
                entity.getNotificationMessage(),
                entity.getCreatedAt()
        );
    }

    public RecurringRuleEntity toEntity(RecurringRule domain) {
        return RecurringRuleEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .name(domain.name())
                .title(domain.title())
                .type(domain.type().name())
                .amount(domain.amount())
                .currency(domain.currency().name())
                .accountId(domain.accountId())
                .categoryId(domain.categoryId())
                .frequency(domain.frequency().name())
                .dayOfMonth(domain.dayOfMonth())
                .startDate(domain.startDate())
                .endDate(domain.endDate())
                .nextExecutionDate(domain.nextExecutionDate())
                .active(domain.active())
                .notifyDaysBefore(domain.notifyDaysBefore())
                .notificationMessage(domain.notificationMessage())
                .createdAt(domain.createdAt())
                .build();
    }
}
