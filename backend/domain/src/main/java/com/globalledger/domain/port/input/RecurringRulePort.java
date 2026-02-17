package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RecurringRulePort {
    RecurringRule create(UUID userId, String name, String title, TransactionType type,
                          BigDecimal amount, Currency currency, Long accountId, Long categoryId,
                          RecurringFrequency frequency, Integer dayOfMonth, LocalDate startDate,
                          LocalDate endDate, Integer notifyDaysBefore, String notificationMessage);

    RecurringRule update(UUID userId, Long ruleId, String name, String title, BigDecimal amount,
                          Long categoryId, RecurringFrequency frequency, Integer dayOfMonth,
                          LocalDate endDate, Integer notifyDaysBefore, String notificationMessage);

    List<RecurringRule> getList(UUID userId, Boolean active);

    RecurringRule getById(UUID userId, Long ruleId);

    void delete(UUID userId, Long ruleId);

    Transaction executeNow(UUID userId, Long ruleId);

    List<Transaction> executeBatch(UUID userId, List<Long> ruleIds);

    RecurringRule toggle(UUID userId, Long ruleId);
}
