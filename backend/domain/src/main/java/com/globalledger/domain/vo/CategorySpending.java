package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;

public record CategorySpending(
        String categoryName,
        BigDecimal amount,
        Currency currency,
        BigDecimal percentage
) {
    public static CategorySpending of(String categoryName, BigDecimal amount, Currency currency, BigDecimal totalAmount) {
        BigDecimal percentage = totalAmount.compareTo(BigDecimal.ZERO) > 0
                ? amount.divide(totalAmount, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;
        return new CategorySpending(categoryName, amount, currency, percentage.setScale(2, java.math.RoundingMode.HALF_UP));
    }
}
