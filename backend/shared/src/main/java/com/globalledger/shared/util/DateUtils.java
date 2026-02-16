package com.globalledger.shared.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

public class DateUtils {

    public static BigDecimal calculateTimeProgressRate(YearMonth yearMonth) {
        LocalDate today = LocalDate.now();
        LocalDate firstDay = yearMonth.atDay(1);
        LocalDate lastDay = yearMonth.atEndOfMonth();

        if (today.isBefore(firstDay)) {
            return BigDecimal.ZERO;
        }
        if (today.isAfter(lastDay)) {
            return BigDecimal.valueOf(100);
        }

        long totalDays = yearMonth.lengthOfMonth();
        long passedDays = today.getDayOfMonth();

        return BigDecimal.valueOf(passedDays)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
    }

    public static long daysRemaining(YearMonth yearMonth) {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = yearMonth.atEndOfMonth();

        if (today.isAfter(lastDay)) {
            return 0;
        }
        return ChronoUnit.DAYS.between(today, lastDay);
    }

    public static long daysElapsed(YearMonth yearMonth) {
        LocalDate today = LocalDate.now();
        LocalDate firstDay = yearMonth.atDay(1);
        LocalDate lastDay = yearMonth.atEndOfMonth();

        if (today.isBefore(firstDay)) {
            return 0;
        }

        LocalDate effectiveToday = today.isAfter(lastDay) ? lastDay : today;
        return ChronoUnit.DAYS.between(firstDay, effectiveToday) + 1;
    }
}
