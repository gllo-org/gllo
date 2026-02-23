package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;

public record BudgetStatus(
        BigDecimal budgetAmount,
        Currency currency,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal timeProgressRate,
        BigDecimal budgetProgressRate,
        BigDecimal recommendedDailyAmount,
        long daysRemaining
) {
}
