package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.input.DashboardStatisticsPort;
import com.globalledger.domain.vo.DashboardStatistics;
import com.globalledger.inbound.web.dto.response.DashboardStatisticsResponse;
import com.globalledger.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardStatisticsPort dashboardStatisticsUseCase;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<DashboardStatisticsResponse>> getStatistics(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Currency currency,
            @RequestParam(required = false, defaultValue = "false") boolean excludeTrip) {

        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        Currency targetCurrency = currency != null ? currency : Currency.KRW;

        DashboardStatistics statistics = dashboardStatisticsUseCase.getStatistics(
                userId, start, end, targetCurrency, excludeTrip);

        return ResponseEntity.ok(ApiResponse.success(DashboardStatisticsResponse.from(statistics)));
    }
}
