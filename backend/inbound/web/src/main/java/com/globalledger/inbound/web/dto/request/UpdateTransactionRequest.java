package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateTransactionRequest(
        @Size(max = 100, message = "항목명은 100자 이하여야 합니다.")
        String title,

        @Positive(message = "금액은 0보다 커야 합니다.")
        BigDecimal amount,

        Long categoryId,

        Long tripId,

        LocalDate transactionDate,

        String note,

        BigDecimal customExchangeRate,

        BigDecimal customConvertedAmount
) {
}
