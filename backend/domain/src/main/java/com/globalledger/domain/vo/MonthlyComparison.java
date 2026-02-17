package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthlyComparison(
        YearMonth yearMonth,
        BigDecimal income,
        BigDecimal expense,
        Currency currency
) {
}
