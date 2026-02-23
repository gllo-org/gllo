package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.YearMonth;

public record SetBudgetRequest(
        @NotNull(message = "년월은 필수입니다.")
        YearMonth yearMonth,

        @NotNull(message = "예산 금액은 필수입니다.")
        @Positive(message = "예산 금액은 0보다 커야 합니다.")
        BigDecimal amount,

        @NotNull(message = "통화는 필수입니다.")
        Currency currency
) {
}
