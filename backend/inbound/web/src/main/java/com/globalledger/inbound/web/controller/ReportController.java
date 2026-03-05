package com.globalledger.inbound.web.controller;

import com.globalledger.domain.port.input.GeneratePdfReportPort;
import com.globalledger.domain.port.input.MonthlyAnalyticsPort;
import com.globalledger.domain.port.output.PdfGeneratorPort;
import com.globalledger.domain.vo.MonthlyReportData;
import com.globalledger.inbound.web.dto.response.MonthlyAnalyticsResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Tag(name = "리포트 API")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final GeneratePdfReportPort reportUseCase;
    private final PdfGeneratorPort pdfGenerator;
    private final MonthlyAnalyticsPort monthlyAnalyticsUseCase;

    @Operation(summary = "월별 자산 리포트 PDF 다운로드", description = "지정된 월의 자산 현황 리포트를 PDF로 생성하여 다운로드합니다.")
    @GetMapping("/monthly/{yearMonth}/pdf")
    public ResponseEntity<byte[]> downloadMonthlyReportPdf(
            Authentication authentication,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth) {

        UUID userId = UUID.fromString(authentication.getName());
        MonthlyReportData reportData = reportUseCase.getMonthlyReportData(userId, yearMonth);
        byte[] pdfBytes = pdfGenerator.generateMonthlyReport(reportData);

        String filename = String.format("global-ledger-%s-report.pdf",
                yearMonth.format(DateTimeFormatter.ofPattern("yyyy-MM")));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @Operation(summary = "월별 분석 데이터 조회", description = "수입/지출 합계, 카테고리별 지출, 일별 지출 등 분석용 데이터를 조회합니다.")
    @GetMapping("/monthly/{yearMonth}")
    public ResponseEntity<ApiResponse<MonthlyAnalyticsResponse>> getMonthlyAnalytics(
            Authentication authentication,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth) {

        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                MonthlyAnalyticsResponse.from(monthlyAnalyticsUseCase.getMonthlyAnalytics(userId, yearMonth))));
    }
}
