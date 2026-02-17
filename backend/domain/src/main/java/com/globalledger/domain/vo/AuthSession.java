package com.globalledger.domain.vo;

import java.util.UUID;

public record AuthSession(
        UUID userId,
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}
