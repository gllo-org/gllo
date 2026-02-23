package com.globalledger.inbound.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileImageRequest(
        @NotBlank(message = "이미지 URL은 필수입니다.")
        @Size(max = 500, message = "이미지 URL은 500자 이하여야 합니다.")
        String imageUrl
) {
}
