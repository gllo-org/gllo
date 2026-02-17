package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ExecuteBatchRequest(
        @NotEmpty(message = "실행할 규칙 ID 목록은 필수입니다.")
        List<Long> ruleIds
) {
}
