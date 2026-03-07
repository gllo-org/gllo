package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyAnalytics(
        String yearMonth,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        Currency currency,
        List<MonthlyAnalyticsCategoryExpense> categoryExpenses,
        List<MonthlyAnalyticsCategoryExpense> categoryIncomes,
        List<MonthlyAnalyticsDailyExpense> dailyExpenses
) {
}
