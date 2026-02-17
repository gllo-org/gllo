package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record AccountSummary(
        Long accountId,
        String accountName,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        BigDecimal currentRate,
        BigDecimal unrealizedPnl,
        BigDecimal unrealizedPnlPercent
) {

    public static AccountSummary of(
            Long accountId,
            String accountName,
            Currency currency,
            BigDecimal balance,
            BigDecimal averageRate,
            BigDecimal currentRate
    ) {
        BigDecimal pnl = calculateUnrealizedPnl(balance, averageRate, currentRate);
        BigDecimal pnlPercent = calculatePnlPercent(averageRate, currentRate);

        return new AccountSummary(
                accountId,
                accountName,
                currency,
                balance.setScale(currency.getDecimalScale(), RoundingMode.HALF_UP),
                averageRate.setScale(4, RoundingMode.HALF_UP),
                currentRate.setScale(4, RoundingMode.HALF_UP),
                pnl,
                pnlPercent
        );
    }

    private static BigDecimal calculateUnrealizedPnl(BigDecimal balance, BigDecimal avgRate, BigDecimal currentRate) {
        if (avgRate == null || avgRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return balance.multiply(currentRate.subtract(avgRate))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal calculatePnlPercent(BigDecimal avgRate, BigDecimal currentRate) {
        if (avgRate == null || avgRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentRate.subtract(avgRate)
                .divide(avgRate, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
