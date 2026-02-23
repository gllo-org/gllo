package com.globalledger.application.usecase.auth;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.UserProfile;
import com.globalledger.domain.port.input.AuthPort;
import com.globalledger.domain.port.output.AuthServicePort;
import com.globalledger.domain.port.output.UserProfileRepositoryPort;
import com.globalledger.domain.vo.AuthSession;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuthUseCaseImpl implements AuthPort {

    private final AuthServicePort authServicePort;
    private final UserProfileRepositoryPort userProfileRepository;

    @Override
    public void sendLoginOtp(String email) {
        authServicePort.sendOtp(email);
        log.info("Login OTP sent to: {}", email);
    }

    @Override
    public AuthSession verifyOtp(String email, String token) {
        AuthSession session = authServicePort.verifyOtp(email, token);
        log.info("OTP verified for user: {}", session.userId());
        return session;
    }

    @Override
    public void deleteAccount(UUID userId, String accessToken) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_PROFILE_NOT_FOUND));
        userProfileRepository.save(profile.softDelete());
        log.info("Account soft-deleted: {}", userId);
    }
}
