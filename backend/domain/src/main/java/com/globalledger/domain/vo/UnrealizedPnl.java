package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;

public record UnrealizedPnl(
        Long accountId,
        String accountName,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        BigDecimal currentRate,
        BigDecimal unrealizedPnl,
        BigDecimal unrealizedPnlPercentage
) {
    public static UnrealizedPnl calculate(Long accountId, String accountName, Currency currency,
                                           BigDecimal balance, BigDecimal averageRate,
                                           BigDecimal currentRate) {
        BigDecimal pnl = balance.multiply(currentRate.subtract(averageRate));
        BigDecimal pnlPercentage = averageRate.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : currentRate.subtract(averageRate)
                .divide(averageRate, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return new UnrealizedPnl(accountId, accountName, currency, balance, averageRate,
                currentRate, pnl, pnlPercentage);
    }
}
