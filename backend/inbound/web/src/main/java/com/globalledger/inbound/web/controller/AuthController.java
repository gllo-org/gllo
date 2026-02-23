package com.globalledger.inbound.web.controller;

import com.globalledger.domain.port.input.AuthPort;
import com.globalledger.domain.vo.AuthSession;
import com.globalledger.inbound.web.dto.request.SendOtpRequest;
import com.globalledger.inbound.web.dto.request.VerifyOtpRequest;
import com.globalledger.inbound.web.dto.response.AuthSessionResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

    @Operation(
            summary = "OTP 전송 (회원가입/로그인 통합)",
            description = "이메일로 OTP를 전송합니다. 신규 이메일이면 자동으로 계정이 생성되고, 기존 이메일이면 로그인 OTP가 전송됩니다."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP 전송 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "이메일 형식 오류")
    })
    @PostMapping("/otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authPort.sendLoginOtp(request.email());
        return ResponseEntity.ok(ApiResponse.success("OTP가 이메일로 전송되었습니다.", null));
    }

    @Operation(
            summary = "OTP 인증",
            description = "이메일과 OTP 토큰으로 인증하여 액세스 토큰을 발급합니다."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "인증 성공, 토큰 발급"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효하지 않은 OTP 또는 만료"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthSession session = authPort.verifyOtp(request.email(), request.token());
        return ResponseEntity.ok(ApiResponse.success("인증에 성공했습니다.", AuthSessionResponse.from(session)));
    }

    @Operation(
            summary = "계정 탈퇴",
            description = "계정을 탈퇴 처리합니다. 탈퇴 후 30일 이내에 재로그인하면 계정이 자동으로 복구됩니다. 30일 경과 후에는 새 계정으로 초기화됩니다."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "탈퇴 처리 완료"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "사용자 프로필 없음")
    })
    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            Authentication authentication,
            @RequestHeader("Authorization") String authHeader
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        String accessToken = authHeader.replace("Bearer ", "");
        authPort.deleteAccount(userId, accessToken);
        return ResponseEntity.ok(ApiResponse.success("계정이 탈퇴 처리되었습니다.", null));
    }
}
