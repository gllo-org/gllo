package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.DashboardHome;

import java.math.BigDecimal;

public record DashboardHomeResponse(
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
    public static DashboardHomeResponse from(DashboardHome home) {
        return new DashboardHomeResponse(
                home.totalAssetKrw(),
                home.monthlyIncome(),
                home.monthlyExpense(),
                home.budgetAmount(),
                home.budgetSpent(),
                home.budgetSpentRate(),
                home.timeProgressRate(),
                home.dailyRecommended(),
                home.currency()
        );
    }
}
