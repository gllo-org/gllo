package com.globalledger.application.usecase.recurringrule;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.*;
import com.globalledger.domain.port.input.RecurringRulePort;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.domain.port.output.RecurringRuleRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class RecurringRuleUseCaseImpl implements RecurringRulePort {

    private final RecurringRuleRepositoryPort recurringRuleRepository;
    private final TransactionPort transactionPort;

    @Override
    public RecurringRule create(UUID userId, String name, String title, TransactionType type,
                                 BigDecimal amount, Currency currency, Long accountId, Long categoryId,
                                 RecurringFrequency frequency, Integer dayOfMonth, LocalDate startDate,
                                 LocalDate endDate, Integer notifyDaysBefore, String notificationMessage) {

        RecurringRule rule = RecurringRule.create(userId, name, title, type, amount, currency,
                accountId, categoryId, frequency, dayOfMonth, startDate, endDate,
                notifyDaysBefore, notificationMessage);

        return recurringRuleRepository.save(rule);
    }

    @Override
    public RecurringRule update(UUID userId, Long ruleId, String name, String title, BigDecimal amount,
                                 Long categoryId, RecurringFrequency frequency, Integer dayOfMonth,
                                 LocalDate endDate, Integer notifyDaysBefore, String notificationMessage) {

        RecurringRule existingRule = getById(userId, ruleId);

        String updatedName = name != null ? name : existingRule.name();
        String updatedTitle = title != null ? title : existingRule.title();
        BigDecimal updatedAmount = amount != null ? amount : existingRule.amount();
        Long updatedCategoryId = categoryId != null ? categoryId : existingRule.categoryId();
        RecurringFrequency updatedFrequency = frequency != null ? frequency : existingRule.frequency();
        Integer updatedDayOfMonth = dayOfMonth != null ? dayOfMonth : existingRule.dayOfMonth();
        LocalDate updatedEndDate = endDate != null ? endDate : existingRule.endDate();
        Integer updatedNotifyDaysBefore = notifyDaysBefore != null ? notifyDaysBefore : existingRule.notifyDaysBefore();
        String updatedNotificationMessage = notificationMessage != null ? notificationMessage : existingRule.notificationMessage();

        RecurringRule updatedRule = new RecurringRule(
                existingRule.id(),
                existingRule.userId(),
                updatedName,
                updatedTitle,
                existingRule.type(),
                updatedAmount,
                existingRule.currency(),
                existingRule.accountId(),
                updatedCategoryId,
                updatedFrequency,
                updatedDayOfMonth,
                existingRule.startDate(),
                updatedEndDate,
                existingRule.nextExecutionDate(),
                existingRule.active(),
                updatedNotifyDaysBefore,
                updatedNotificationMessage,
                existingRule.createdAt()
        );

        return recurringRuleRepository.save(updatedRule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringRule> getList(UUID userId, Boolean active) {
        List<RecurringRule> allRules = recurringRuleRepository.findAllByUserId(userId);

        if (active == null) {
            return allRules;
        }

        return allRules.stream()
                .filter(rule -> rule.active().equals(active))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RecurringRule getById(UUID userId, Long ruleId) {
        return recurringRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RECURRING_RULE_NOT_FOUND));
    }

    @Override
    public void delete(UUID userId, Long ruleId) {
        RecurringRule rule = getById(userId, ruleId);
        recurringRuleRepository.deleteById(ruleId);
    }

    @Override
    public Transaction executeNow(UUID userId, Long ruleId) {
        RecurringRule rule = getById(userId, ruleId);

        return transactionPort.create(
                userId,
                rule.accountId(),
                rule.type(),
                rule.title(),
                rule.amount(),
                rule.currency(),
                rule.categoryId(),
                null,
                LocalDate.now(),
                "고정 지출/수익: " + rule.name(),
                null,
                null
        );
    }

    @Override
    public List<Transaction> executeBatch(UUID userId, List<Long> ruleIds) {
        List<Transaction> createdTransactions = new ArrayList<>();

        for (Long ruleId : ruleIds) {
            Transaction transaction = executeNow(userId, ruleId);
            createdTransactions.add(transaction);
        }

        return createdTransactions;
    }

    @Override
    public RecurringRule toggle(UUID userId, Long ruleId) {
        RecurringRule rule = getById(userId, ruleId);
        RecurringRule toggledRule = rule.toggleActive();
        return recurringRuleRepository.save(toggledRule);
    }
}
