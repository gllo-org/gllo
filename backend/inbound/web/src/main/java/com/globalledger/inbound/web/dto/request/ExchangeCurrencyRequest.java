package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ExchangeCurrencyRequest(
        @NotNull(message = "출금 계좌 ID는 필수입니다.")
        Long fromAccountId,

        @NotNull(message = "입금 계좌 ID는 필수입니다.")
        Long toAccountId,

        @NotNull(message = "환전 금액은 필수입니다.")
        @Positive(message = "환전 금액은 0보다 커야 합니다.")
        BigDecimal amount
) {
}
