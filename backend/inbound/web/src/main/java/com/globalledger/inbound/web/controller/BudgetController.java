package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.port.input.BudgetPort;
import com.globalledger.domain.vo.BudgetStatus;
import com.globalledger.inbound.web.dto.request.SetBudgetRequest;
import com.globalledger.inbound.web.dto.response.BudgetStatusResponse;
import com.globalledger.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetPort budgetUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> setBudget(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody SetBudgetRequest request) {

        MonthlyBudget budget = budgetUseCase.set(
                userId,
                request.yearMonth(),
                request.amount(),
                request.currency()
        );

        String message = budget.id() != null ? "예산이 설정되었습니다." : "예산이 업데이트되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<BudgetStatusResponse>> getBudgetStatus(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) YearMonth yearMonth) {

        YearMonth targetMonth = yearMonth != null ? yearMonth : YearMonth.now();
        BudgetStatus status = budgetUseCase.getStatus(userId, targetMonth);

        return ResponseEntity.ok(ApiResponse.success(BudgetStatusResponse.from(status)));
    }
}
