package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.port.input.BudgetPort;
import com.globalledger.domain.vo.BudgetStatus;
import com.globalledger.inbound.web.dto.request.SetBudgetRequest;
import com.globalledger.inbound.web.dto.response.BudgetStatusResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.UUID;

@Tag(name = "예산 API")
@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetPort budgetUseCase;

    @Operation(summary = "예산 설정", description = "월별 예산을 설정하거나 업데이트합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> setBudget(
            Authentication authentication,
            @Valid @RequestBody SetBudgetRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        MonthlyBudget budget = budgetUseCase.set(
                userId,
                request.yearMonth(),
                request.amount(),
                request.currency()
        );

        String message = budget.id() != null ? "예산이 설정되었습니다." : "예산이 업데이트되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @Operation(summary = "예산 현황 조회", description = "월별 예산 사용 현황을 조회합니다.")
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<BudgetStatusResponse>> getBudgetStatus(
            Authentication authentication,
            @RequestParam(required = false) YearMonth yearMonth) {

        UUID userId = UUID.fromString(authentication.getName());
        YearMonth targetMonth = yearMonth != null ? yearMonth : YearMonth.now();
        BudgetStatus status = budgetUseCase.getStatus(userId, targetMonth);

        return ResponseEntity.ok(ApiResponse.success(BudgetStatusResponse.from(status)));
    }
}
