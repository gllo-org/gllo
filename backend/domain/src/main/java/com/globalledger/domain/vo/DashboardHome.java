package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;

public record DashboardHome(
        BigDecimal totalAssetKrw,
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpense,
        BigDecimal budgetAmount,
        BigDecimal budgetSpent,
        BigDecimal budgetSpentRate,
        BigDecimal timeProgressRate,
        BigDecimal dailyRecommended,
        Currency currency
) {
}
