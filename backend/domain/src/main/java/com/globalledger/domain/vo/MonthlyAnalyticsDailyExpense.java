package com.globalledger.domain.vo;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonthlyAnalyticsDailyExpense(
        LocalDate date,
        BigDecimal amount
) {
}
