package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTransactionRequest(
        @NotNull(message = "계좌 ID는 필수입니다.")
        Long accountId,

        @NotNull(message = "거래 타입은 필수입니다.")
        TransactionType type,

        @NotBlank(message = "거래 항목명은 필수입니다.")
        @Size(max = 100, message = "항목명은 100자 이하여야 합니다.")
        String title,

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

        String note,

        BigDecimal customExchangeRate,

        BigDecimal customConvertedAmount
) {
}
