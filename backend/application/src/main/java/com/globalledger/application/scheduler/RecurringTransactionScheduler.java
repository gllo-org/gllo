package com.globalledger.application.scheduler;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.RecurringRuleRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringTransactionScheduler {

    private final RecurringRuleRepositoryPort recurringRuleRepository;
    private final AccountRepositoryPort accountRepository;
    private final TransactionRepositoryPort transactionRepository;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void executeRecurringTransactions() {
        LocalDate today = LocalDate.now();
        log.info("Executing recurring transactions for date: {}", today);

        List<RecurringRule> dueRules = recurringRuleRepository.findDueRules(today);
        log.info("Found {} due recurring rules", dueRules.size());

        for (RecurringRule rule : dueRules) {
            try {
                executeRule(rule, today);
            } catch (Exception e) {
                log.error("Failed to execute recurring rule {}: {}", rule.id(), e.getMessage());
            }
        }

        log.info("Recurring transaction execution completed");
    }

    private void executeRule(RecurringRule rule, LocalDate today) {
        Account account = accountRepository.findByIdAndUserId(rule.accountId(), rule.userId())
                .orElseThrow(() -> new RuntimeException("Account not found: " + rule.accountId()));

        Transaction transaction = Transaction.create(
                rule.userId(),
                rule.accountId(),
                rule.type(),
                rule.title(),
                rule.amount(),
                rule.currency(),
                rule.categoryId(),
                null,
                today,
                String.format("고정 지출: %s", rule.name()),
                null,
                null,
                null
        );

        transactionRepository.save(transaction);

        Account updatedAccount = rule.type().name().equals("EXPENSE")
                ? account.withdraw(rule.amount())
                : account.deposit(rule.amount(), account.averageRate());

        accountRepository.save(updatedAccount);

        LocalDate nextDate = calculateNextExecutionDate(rule, today);
        RecurringRule updatedRule = rule.advanceNextExecutionDate(nextDate);
        recurringRuleRepository.save(updatedRule);

        log.info("Executed recurring rule {}: {} {} for user {}",
                rule.id(), rule.amount(), rule.currency(), rule.userId());
    }

    private LocalDate calculateNextExecutionDate(RecurringRule rule, LocalDate currentDate) {
        return switch (rule.frequency()) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> {
                LocalDate nextMonth = currentDate.plusMonths(1);
                int targetDay = rule.dayOfMonth() != null ? rule.dayOfMonth() : currentDate.getDayOfMonth();
                int lastDayOfMonth = nextMonth.lengthOfMonth();
                int actualDay = Math.min(targetDay, lastDayOfMonth);
                yield nextMonth.withDayOfMonth(actualDay);
            }
        };
    }
}
