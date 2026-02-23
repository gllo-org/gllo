package com.globalledger.domain.port.input;

import java.math.BigDecimal;
import java.util.UUID;

public interface ExchangeCurrencyPort {
    void exchange(UUID userId, Long fromAccountId, Long toAccountId, BigDecimal amount);
}
