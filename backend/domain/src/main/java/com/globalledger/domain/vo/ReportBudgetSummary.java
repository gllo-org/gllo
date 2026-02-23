package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record ReportBudgetSummary(
        Currency currency,
        BigDecimal budgetAmount,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal budgetProgressRate
) {

    public static ReportBudgetSummary of(Currency currency, BigDecimal budget, BigDecimal spent) {
        BigDecimal remaining = budget.subtract(spent);
        BigDecimal progressRate = budget.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : spent.divide(budget, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);

        return new ReportBudgetSummary(
                currency,
                budget.setScale(2, RoundingMode.HALF_UP),
                spent.setScale(2, RoundingMode.HALF_UP),
                remaining.setScale(2, RoundingMode.HALF_UP),
                progressRate
        );
    }
}
