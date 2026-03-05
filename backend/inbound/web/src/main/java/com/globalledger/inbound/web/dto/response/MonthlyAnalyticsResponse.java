package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.MonthlyAnalytics;
import com.globalledger.domain.vo.MonthlyAnalyticsCategoryExpense;
import com.globalledger.domain.vo.MonthlyAnalyticsDailyExpense;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyAnalyticsResponse(
        String yearMonth,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        Currency currency,
        List<CategoryExpenseDto> categoryExpenses,
        List<DailyExpenseDto> dailyExpenses
) {
    public record CategoryExpenseDto(
            String categoryName,
            String categoryEmoji,
            BigDecimal amount,
            BigDecimal percentage
    ) {
        static CategoryExpenseDto from(MonthlyAnalyticsCategoryExpense cat) {
            return new CategoryExpenseDto(cat.categoryName(), "", cat.amount(), cat.percentage());
        }
    }

    public record DailyExpenseDto(
            String date,
            BigDecimal amount
    ) {
        static DailyExpenseDto from(MonthlyAnalyticsDailyExpense daily) {
            return new DailyExpenseDto(daily.date().toString(), daily.amount());
        }
    }

    public static MonthlyAnalyticsResponse from(MonthlyAnalytics analytics) {
        return new MonthlyAnalyticsResponse(
                analytics.yearMonth(),
                analytics.totalIncome(),
                analytics.totalExpense(),
                analytics.currency(),
                analytics.categoryExpenses().stream().map(CategoryExpenseDto::from).toList(),
                analytics.dailyExpenses().stream().map(DailyExpenseDto::from).toList()
        );
    }
}
