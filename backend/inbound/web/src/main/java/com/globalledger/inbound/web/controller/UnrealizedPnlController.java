package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.input.UnrealizedPnlPort;
import com.globalledger.domain.vo.UnrealizedPnl;
import com.globalledger.inbound.web.dto.response.UnrealizedPnlResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "평가손익", description = "외화 계좌 평가손익 조회 API")
@RestController
@RequestMapping("/api/v1/unrealized-pnl")
@RequiredArgsConstructor
public class UnrealizedPnlController {

    private final UnrealizedPnlPort unrealizedPnlPort;

    @Operation(summary = "전체 계좌 평가손익 조회", description = "사용자의 모든 외화 계좌에 대한 평가손익을 기준 통화로 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<UnrealizedPnlResponse>>> getAllPnl(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "KRW") Currency baseCurrency) {
        List<UnrealizedPnl> pnlList = unrealizedPnlPort.getAllUnrealizedPnl(
                UUID.fromString(userId), baseCurrency);
        List<UnrealizedPnlResponse> response = pnlList.stream()
                .map(UnrealizedPnlResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("평가손익을 조회했습니다.", response));
    }

    @Operation(summary = "특정 계좌 평가손익 조회", description = "특정 계좌의 평가손익을 기준 통화로 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "계좌 또는 환율 정보 없음")
    })
    @GetMapping("/{accountId}")
    public ResponseEntity<ApiResponse<UnrealizedPnlResponse>> getPnl(
            @AuthenticationPrincipal String userId,
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "KRW") Currency baseCurrency) {
        UnrealizedPnl pnl = unrealizedPnlPort.getUnrealizedPnl(
                UUID.fromString(userId), accountId, baseCurrency);
        UnrealizedPnlResponse response = UnrealizedPnlResponse.from(pnl);
        return ResponseEntity.ok(ApiResponse.success("평가손익을 조회했습니다.", response));
    }
}
