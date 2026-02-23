package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.BudgetStatus;

import java.math.BigDecimal;

public record BudgetStatusResponse(
        BigDecimal budgetAmount,
        Currency currency,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal timeProgressRate,
        BigDecimal budgetProgressRate,
        BigDecimal recommendedDailyAmount,
        long daysRemaining
) {
    public static BudgetStatusResponse from(BudgetStatus status) {
        return new BudgetStatusResponse(
                status.budgetAmount(),
                status.currency(),
                status.spentAmount(),
                status.remainingAmount(),
                status.timeProgressRate(),
                status.budgetProgressRate(),
                status.recommendedDailyAmount(),
                status.daysRemaining()
        );
    }
}
