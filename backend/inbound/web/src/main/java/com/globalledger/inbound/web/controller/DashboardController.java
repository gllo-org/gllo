package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.input.DashboardHomePort;
import com.globalledger.domain.port.input.DashboardStatisticsPort;
import com.globalledger.domain.vo.DashboardStatistics;
import com.globalledger.inbound.web.dto.response.DashboardHomeResponse;
import com.globalledger.inbound.web.dto.response.DashboardStatisticsResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Tag(name = "대시보드 API")
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardStatisticsPort dashboardStatisticsUseCase;
    private final DashboardHomePort dashboardHomeUseCase;

    @Operation(summary = "대시보드 통계 조회", description = "기간별 수입/지출, 카테고리별 지출, 일별 자산 추이 등 대시보드 통계를 조회합니다.")
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<DashboardStatisticsResponse>> getStatistics(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Currency currency,
            @RequestParam(required = false, defaultValue = "false") boolean excludeTrip) {

        UUID userId = UUID.fromString(authentication.getName());
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        Currency targetCurrency = currency != null ? currency : Currency.KRW;

        DashboardStatistics statistics = dashboardStatisticsUseCase.getStatistics(
                userId, start, end, targetCurrency, excludeTrip);

        return ResponseEntity.ok(ApiResponse.success(DashboardStatisticsResponse.from(statistics)));
    }

    @Operation(summary = "홈 대시보드 조회", description = "총 자산(KRW 환산), 이번 달 수입/지출, 예산 현황을 한 번에 반환합니다.")
    @GetMapping("/home")
    public ResponseEntity<ApiResponse<DashboardHomeResponse>> getDashboardHome(
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                DashboardHomeResponse.from(dashboardHomeUseCase.getDashboardHome(userId))));
    }
}
