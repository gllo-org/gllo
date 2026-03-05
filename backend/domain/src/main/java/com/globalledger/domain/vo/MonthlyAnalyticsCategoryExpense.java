package com.globalledger.domain.vo;

import java.math.BigDecimal;

public record MonthlyAnalyticsCategoryExpense(
        String categoryName,
        String categoryEmoji,
        BigDecimal amount,
        BigDecimal percentage
) {
}
