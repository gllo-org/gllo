package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecurringRuleResponse(
        Long id,
        String name,
        String title,
        TransactionType type,
        BigDecimal amount,
        Currency currency,
        Long accountId,
        Long categoryId,
        RecurringFrequency frequency,
        Integer dayOfMonth,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextExecutionDate,
        Boolean active,
        Integer notifyDaysBefore,
        String notificationMessage,
        LocalDateTime createdAt
) {
    public static RecurringRuleResponse from(RecurringRule rule) {
        return new RecurringRuleResponse(
                rule.id(),
                rule.name(),
                rule.title(),
                rule.type(),
                rule.amount(),
                rule.currency(),
                rule.accountId(),
                rule.categoryId(),
                rule.frequency(),
                rule.dayOfMonth(),
                rule.startDate(),
                rule.endDate(),
                rule.nextExecutionDate(),
                rule.active(),
                rule.notifyDaysBefore(),
                rule.notificationMessage(),
                rule.createdAt()
        );
    }
}
