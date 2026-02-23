package com.globalledger.domain.port.input;

import com.globalledger.domain.vo.AuthSession;

import java.util.UUID;

public interface AuthPort {
    void sendLoginOtp(String email);
    AuthSession verifyOtp(String email, String token);
    void deleteAccount(UUID userId, String accessToken);
}
