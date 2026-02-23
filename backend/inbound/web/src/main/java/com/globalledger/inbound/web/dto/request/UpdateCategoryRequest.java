package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCategoryRequest(
        @NotBlank(message = "카테고리명은 필수입니다.")
        String name,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "색상은 HEX 형식이어야 합니다. (예: #FF5733)")
        String color
) {
}
