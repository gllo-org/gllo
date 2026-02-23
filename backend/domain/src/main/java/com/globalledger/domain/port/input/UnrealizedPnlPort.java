package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.UnrealizedPnl;

import java.util.List;
import java.util.UUID;

public interface UnrealizedPnlPort {
    UnrealizedPnl getUnrealizedPnl(UUID userId, Long accountId, Currency baseCurrency);
    List<UnrealizedPnl> getAllUnrealizedPnl(UUID userId, Currency baseCurrency);
}
