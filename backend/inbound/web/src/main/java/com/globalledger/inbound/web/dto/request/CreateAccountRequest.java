package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateAccountRequest(
        @NotBlank(message = "계좌명은 필수입니다.")
        String name,

        @NotNull(message = "계좌 타입은 필수입니다.")
        AccountType type,

        @NotNull(message = "통화는 필수입니다.")
        Currency currency,

        @NotNull(message = "초기 잔액은 필수입니다.")
        @PositiveOrZero(message = "초기 잔액은 0 이상이어야 합니다.")
        BigDecimal initialBalance
) {
}
