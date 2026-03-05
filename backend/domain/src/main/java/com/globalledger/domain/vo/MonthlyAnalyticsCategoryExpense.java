package com.globalledger.domain.vo;

import java.math.BigDecimal;

public record MonthlyAnalyticsCategoryExpense(
        String categoryName,
        BigDecimal amount,
        BigDecimal percentage
) {
}
