package com.globalledger.domain.port.output;

import com.globalledger.domain.vo.AuthSession;

import java.util.UUID;

public interface AuthServicePort {
    void sendOtp(String email);
    AuthSession verifyOtp(String email, String token);
    void deleteUser(UUID userId, String accessToken);
}
