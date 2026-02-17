package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTripRequest(
        @NotBlank(message = "여행명은 필수입니다.")
        String name,

        @NotNull(message = "시작일은 필수입니다.")
        LocalDate startDate,

        @NotNull(message = "종료일은 필수입니다.")
        LocalDate endDate,

        @NotNull(message = "예산은 필수입니다.")
        @Positive(message = "예산은 0보다 커야 합니다.")
        BigDecimal budget,

        @NotNull(message = "예산 통화는 필수입니다.")
        Currency budgetCurrency
) {
}
