package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.UnrealizedPnl;

import java.math.BigDecimal;

public record UnrealizedPnlResponse(
        Long accountId,
        String accountName,
        Currency currency,
        BigDecimal balance,
        BigDecimal averageRate,
        BigDecimal currentRate,
        BigDecimal unrealizedPnl,
        BigDecimal unrealizedPnlPercentage
) {
    public static UnrealizedPnlResponse from(UnrealizedPnl pnl) {
        return new UnrealizedPnlResponse(
                pnl.accountId(),
                pnl.accountName(),
                pnl.currency(),
                pnl.balance(),
                pnl.averageRate(),
                pnl.currentRate(),
                pnl.unrealizedPnl(),
                pnl.unrealizedPnlPercentage()
        );
    }
}
