package com.globalledger.inbound.web.controller;

import com.globalledger.domain.port.input.AuthPort;
import com.globalledger.domain.vo.AuthSession;
import com.globalledger.inbound.web.dto.request.SendOtpRequest;
import com.globalledger.inbound.web.dto.request.VerifyOtpRequest;
import com.globalledger.inbound.web.dto.response.AuthSessionResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "인증 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthPort authPort;

    @Operation(summary = "로그인 OTP 전송", description = "이메일로 로그인용 OTP를 전송합니다.")
    @PostMapping("/otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authPort.sendLoginOtp(request.email());
        return ResponseEntity.ok(ApiResponse.success("OTP가 이메일로 전송되었습니다.", null));
    }

    @Operation(summary = "OTP 인증", description = "이메일과 OTP 토큰으로 인증하여 세션을 생성합니다.")
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthSession session = authPort.verifyOtp(request.email(), request.token());
        return ResponseEntity.ok(ApiResponse.success("인증에 성공했습니다.", AuthSessionResponse.from(session)));
    }

    @Operation(summary = "계정 탈퇴", description = "현재 로그인한 사용자의 계정을 영구적으로 삭제합니다.")
    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            Authentication authentication,
            @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        String accessToken = authHeader.replace("Bearer ", "");
        authPort.deleteAccount(userId, accessToken);
        return ResponseEntity.ok(ApiResponse.success("계정이 삭제되었습니다.", null));
    }
}
