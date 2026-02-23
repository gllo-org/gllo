package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RecurringRule(
        Long id,
        UUID userId,
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
    public RecurringRule advanceNextExecutionDate(LocalDate nextDate) {
        return new RecurringRule(id, userId, name, title, type, amount, currency,
                accountId, categoryId, frequency, dayOfMonth,
                startDate, endDate, nextDate, active, notifyDaysBefore,
                notificationMessage, createdAt);
    }

    public RecurringRule toggleActive() {
        return new RecurringRule(id, userId, name, title, type, amount, currency,
                accountId, categoryId, frequency, dayOfMonth,
                startDate, endDate, nextExecutionDate, !active, notifyDaysBefore,
                notificationMessage, createdAt);
    }

    public static RecurringRule create(UUID userId, String name, String title, TransactionType type,
                                        BigDecimal amount, Currency currency, Long accountId,
                                        Long categoryId, RecurringFrequency frequency, Integer dayOfMonth,
                                        LocalDate startDate, LocalDate endDate, Integer notifyDaysBefore,
                                        String notificationMessage) {
        LocalDate nextExecutionDate = calculateNextExecutionDate(startDate, frequency, dayOfMonth);
        return new RecurringRule(null, userId, name, title, type, amount, currency,
                accountId, categoryId, frequency, dayOfMonth, startDate, endDate,
                nextExecutionDate, true, notifyDaysBefore, notificationMessage, LocalDateTime.now());
    }

    private static LocalDate calculateNextExecutionDate(LocalDate startDate, RecurringFrequency frequency, Integer dayOfMonth) {
        LocalDate today = LocalDate.now();
        if (startDate.isAfter(today)) {
            return startDate;
        }

        return switch (frequency) {
            case DAILY -> today.plusDays(1);
            case WEEKLY -> today.plusWeeks(1);
            case MONTHLY -> {
                LocalDate nextMonth = today.withDayOfMonth(Math.min(dayOfMonth, today.lengthOfMonth()));
                yield nextMonth.isBefore(today) ? nextMonth.plusMonths(1) : nextMonth;
            }
        };
    }
}
