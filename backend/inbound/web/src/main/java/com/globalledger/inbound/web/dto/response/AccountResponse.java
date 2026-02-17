package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String name,
        AccountType type,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        LocalDateTime createdAt
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.id(),
                account.name(),
                account.type(),
                account.currency(),
                account.balance(),
                account.averageRate(),
                account.createdAt()
        );
    }
}
