package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTransactionRequest(
        @NotNull(message = "계좌 ID는 필수입니다.")
        Long accountId,

        @NotNull(message = "거래 타입은 필수입니다.")
        TransactionType type,

        @NotNull(message = "금액은 필수입니다.")
        @Positive(message = "금액은 0보다 커야 합니다.")
        BigDecimal amount,

        @NotNull(message = "통화는 필수입니다.")
        Currency currency,

        @NotNull(message = "카테고리 ID는 필수입니다.")
        Long categoryId,

        Long tripId,

        @NotNull(message = "거래일자는 필수입니다.")
        LocalDate transactionDate,

        String note
) {
}
