package com.globalledger.shared.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

public class CurrencyUtils {

    private static final Set<String> SUPPORTED_CURRENCIES = Set.of("EUR", "USD", "GBP", "KRW");
    private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of("KRW");
    private static final int DEFAULT_DECIMAL_SCALE = 2;
    private static final int RATE_SCALE = 6;

    public static boolean isSupported(String currency) {
        return SUPPORTED_CURRENCIES.contains(currency);
    }

    public static BigDecimal roundAmount(BigDecimal amount, String currency) {
        int scale = ZERO_DECIMAL_CURRENCIES.contains(currency) ? 0 : DEFAULT_DECIMAL_SCALE;
        return amount.setScale(scale, RoundingMode.HALF_UP);
    }

    public static BigDecimal roundRate(BigDecimal rate) {
        return rate.setScale(RATE_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateAverageRate(
            BigDecimal existingBalance,
            BigDecimal existingRate,
            BigDecimal newAmount,
            BigDecimal newRate) {
        BigDecimal totalBalance = existingBalance.add(newAmount);
        if (totalBalance.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return existingBalance.multiply(existingRate)
                .add(newAmount.multiply(newRate))
                .divide(totalBalance, RATE_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateUnrealizedPnl(
            BigDecimal balance,
            BigDecimal averageRate,
            BigDecimal currentRate) {
        return balance.multiply(currentRate.subtract(averageRate))
                .setScale(0, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculatePnlRate(
            BigDecimal averageRate,
            BigDecimal currentRate) {
        if (averageRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentRate.subtract(averageRate)
                .multiply(BigDecimal.valueOf(100))
                .divide(averageRate, 4, RoundingMode.HALF_UP);
    }
}
