package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.CategorySpending;

import java.math.BigDecimal;

public record CategorySpendingResponse(
        String categoryName,
        BigDecimal amount,
        Currency currency,
        BigDecimal percentage
) {
    public static CategorySpendingResponse from(CategorySpending categorySpending) {
        return new CategorySpendingResponse(
                categorySpending.categoryName(),
                categorySpending.amount(),
                categorySpending.currency(),
                categorySpending.percentage()
        );
    }
}
