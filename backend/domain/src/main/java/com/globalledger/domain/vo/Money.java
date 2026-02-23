package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record Money(BigDecimal amount, Currency currency) {

    public static Money of(BigDecimal amount, Currency currency) {
        return new Money(amount.setScale(currency.getDecimalScale(), RoundingMode.HALF_UP), currency);
    }

    public static Money zero(Currency currency) {
        return Money.of(BigDecimal.ZERO, currency);
    }

    public Money add(Money other) {
        return Money.of(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        return Money.of(this.amount.subtract(other.amount), this.currency);
    }
}
