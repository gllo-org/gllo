package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.vo.AuthSession;

import java.util.UUID;

public record AuthSessionResponse(
        UUID userId,
        String accessToken,
        String refreshToken,
        long expiresIn
) {
    public static AuthSessionResponse from(AuthSession authSession) {
        return new AuthSessionResponse(
                authSession.userId(),
                authSession.accessToken(),
                authSession.refreshToken(),
                authSession.expiresIn()
        );
    }
}
