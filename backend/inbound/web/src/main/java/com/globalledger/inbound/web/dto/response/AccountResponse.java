package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.UnrealizedPnl;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String name,
        AccountType type,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        BigDecimal unrealizedPnl,
        BigDecimal pnlRate,
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
                null,
                null,
                account.createdAt()
        );
    }

    public static AccountResponse from(Account account, UnrealizedPnl pnl) {
        boolean isBaseCurrency = account.currency() == Currency.KRW;
        return new AccountResponse(
                account.id(),
                account.name(),
                account.type(),
                account.currency(),
                account.balance(),
                account.averageRate(),
                isBaseCurrency ? null : pnl.unrealizedPnl(),
                isBaseCurrency ? null : pnl.unrealizedPnlPercentage(),
                account.createdAt()
        );
    }
}
