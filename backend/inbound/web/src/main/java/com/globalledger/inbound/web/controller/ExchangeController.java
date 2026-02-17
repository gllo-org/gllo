package com.globalledger.inbound.web.controller;

import com.globalledger.domain.port.input.ExchangeCurrencyPort;
import com.globalledger.inbound.web.dto.request.ExchangeCurrencyRequest;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "환전 API")
@RestController
@RequestMapping("/api/v1/exchange")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeCurrencyPort exchangeCurrencyPort;

    @Operation(summary = "통화 환전", description = "계좌 간 환전을 실행합니다. 평단가가 자동으로 계산됩니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "환전 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (동일 계좌, 잔액 부족)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "계좌 또는 환율 정보 없음")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> exchange(
            Authentication authentication,
            @Valid @RequestBody ExchangeCurrencyRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        exchangeCurrencyPort.exchange(
                userId,
                request.fromAccountId(),
                request.toAccountId(),
                request.amount()
        );
        return ResponseEntity.ok(ApiResponse.success("환전이 완료되었습니다.", (Void) null));
    }
}
