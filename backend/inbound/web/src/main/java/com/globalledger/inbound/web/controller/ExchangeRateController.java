package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.port.input.ExchangeRatePort;
import com.globalledger.inbound.web.dto.response.ExchangeRateResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "환율 API")
@RestController
@RequestMapping("/api/v1/exchange-rates")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRatePort exchangeRatePort;

    @Operation(summary = "최신 환율 목록 조회", description = "모든 통화 쌍의 최신 환율을 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<List<ExchangeRateResponse>>> getLatestRates() {
        List<ExchangeRate> rates = exchangeRatePort.getLatest();
        List<ExchangeRateResponse> response = rates.stream()
                .map(ExchangeRateResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("최신 환율 목록을 조회했습니다.", response));
    }

    @Operation(summary = "특정 통화 쌍 환율 조회", description = "기준 통화와 대상 통화 간의 최신 환율을 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "환율 정보 없음")
    })
    @GetMapping("/{baseCurrency}/{targetCurrency}")
    public ResponseEntity<ApiResponse<ExchangeRateResponse>> getRate(
            @PathVariable Currency baseCurrency,
            @PathVariable Currency targetCurrency) {
        ExchangeRate rate = exchangeRatePort.getLatestRate(baseCurrency, targetCurrency);
        ExchangeRateResponse response = ExchangeRateResponse.from(rate);
        return ResponseEntity.ok(ApiResponse.success("환율을 조회했습니다.", response));
    }

    @Operation(summary = "환율 수동 갱신", description = "외부 API에서 최신 환율을 가져와 업데이트합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "갱신 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "API 호출 실패")
    })
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refreshRates() {
        exchangeRatePort.updateRates();
        return ResponseEntity.ok(ApiResponse.success("환율이 갱신되었습니다.", (Void) null));
    }
}
