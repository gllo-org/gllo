package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.MonthlyComparison;

import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyComparisonResponse(
        YearMonth yearMonth,
        BigDecimal income,
        BigDecimal expense,
        Currency currency
) {
    public static MonthlyComparisonResponse from(MonthlyComparison comparison) {
        return new MonthlyComparisonResponse(
                comparison.yearMonth(),
                comparison.income(),
                comparison.expense(),
                comparison.currency()
        );
    }
}
