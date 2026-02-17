package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDisplayNameRequest(
        @NotBlank(message = "표시 이름은 필수입니다.")
        @Size(min = 1, max = 50, message = "표시 이름은 1자 이상 50자 이하여야 합니다.")
        String displayName
) {
}
