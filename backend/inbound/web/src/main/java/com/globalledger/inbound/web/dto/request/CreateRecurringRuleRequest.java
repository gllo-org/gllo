package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRecurringRuleRequest(
        @NotBlank(message = "규칙 이름은 필수입니다.")
        @Size(max = 100, message = "규칙 이름은 100자 이하여야 합니다.")
        String name,

        @NotBlank(message = "거래 항목명은 필수입니다.")
        @Size(max = 100, message = "항목명은 100자 이하여야 합니다.")
        String title,

        @NotNull(message = "거래 타입은 필수입니다.")
        TransactionType type,

        @NotNull(message = "금액은 필수입니다.")
        @Positive(message = "금액은 0보다 커야 합니다.")
        BigDecimal amount,

        @NotNull(message = "통화는 필수입니다.")
        Currency currency,

        @NotNull(message = "계좌 ID는 필수입니다.")
        Long accountId,

        @NotNull(message = "카테고리 ID는 필수입니다.")
        Long categoryId,

        @NotNull(message = "반복 주기는 필수입니다.")
        RecurringFrequency frequency,

        @Min(value = 1, message = "일자는 1 이상이어야 합니다.")
        @Max(value = 28, message = "일자는 28 이하여야 합니다.")
        Integer dayOfMonth,

        @NotNull(message = "시작일은 필수입니다.")
        LocalDate startDate,

        LocalDate endDate,

        @Min(value = 1, message = "알림 일수는 1 이상이어야 합니다.")
        Integer notifyDaysBefore,

        @Size(max = 200, message = "알림 메시지는 200자 이하여야 합니다.")
        String notificationMessage
) {
}
