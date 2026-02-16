package com.globalledger.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record Account(
        Long id,
        UUID userId,
        String name,
        AccountType type,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        LocalDateTime createdAt
) {
    public static Account create(UUID userId, String name, AccountType type,
                                  Currency currency, BigDecimal initialBalance) {
        return new Account(null, userId, name, type, currency, initialBalance,
                BigDecimal.ZERO, LocalDateTime.now());
    }

    public Account deposit(BigDecimal amount, BigDecimal exchangeRate) {
        BigDecimal newBalance = this.balance.add(amount);
        BigDecimal newAvgRate = computeNewAverageRate(amount, exchangeRate, newBalance);
        return new Account(id, userId, name, type, currency, newBalance, newAvgRate, createdAt);
    }

    public Account withdraw(BigDecimal amount) {
        return new Account(id, userId, name, type, currency,
                this.balance.subtract(amount), averageRate, createdAt);
    }

    private BigDecimal computeNewAverageRate(BigDecimal newAmount, BigDecimal newRate, BigDecimal newBalance) {
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (this.averageRate.compareTo(BigDecimal.ZERO) == 0) {
            return newRate;
        }
        return this.balance.multiply(this.averageRate)
                .add(newAmount.multiply(newRate))
                .divide(newBalance, 6, java.math.RoundingMode.HALF_UP);
    }
}
