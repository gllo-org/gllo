package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.RecurringFrequency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateRecurringRuleRequest(
        @Size(max = 100, message = "규칙 이름은 100자 이하여야 합니다.")
        String name,

        @Size(max = 100, message = "항목명은 100자 이하여야 합니다.")
        String title,

        @Positive(message = "금액은 0보다 커야 합니다.")
        BigDecimal amount,

        Long categoryId,

        RecurringFrequency frequency,

        @Min(value = 1, message = "일자는 1 이상이어야 합니다.")
        @Max(value = 28, message = "일자는 28 이하여야 합니다.")
        Integer dayOfMonth,

        LocalDate endDate,

        @Min(value = 1, message = "알림 일수는 1 이상이어야 합니다.")
        Integer notifyDaysBefore,

        @Size(max = 200, message = "알림 메시지는 200자 이하여야 합니다.")
        String notificationMessage
) {
}
