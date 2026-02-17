package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.input.RecurringRulePort;
import com.globalledger.inbound.web.dto.request.CreateRecurringRuleRequest;
import com.globalledger.inbound.web.dto.request.ExecuteBatchRequest;
import com.globalledger.inbound.web.dto.request.UpdateRecurringRuleRequest;
import com.globalledger.inbound.web.dto.response.RecurringRuleResponse;
import com.globalledger.inbound.web.dto.response.TransactionResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "고정 지출/수익 API")
@RestController
@RequestMapping("/api/v1/recurring-rules")
@RequiredArgsConstructor
public class RecurringRuleController {

    private final RecurringRulePort recurringRuleUseCase;

    @Operation(summary = "고정 규칙 생성", description = "새로운 고정 지출/수익 규칙을 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> createRule(
            Authentication authentication,
            @Valid @RequestBody CreateRecurringRuleRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        RecurringRule rule = recurringRuleUseCase.create(
                userId,
                request.name(),
                request.title(),
                request.type(),
                request.amount(),
                request.currency(),
                request.accountId(),
                request.categoryId(),
                request.frequency(),
                request.dayOfMonth(),
                request.startDate(),
                request.endDate(),
                request.notifyDaysBefore(),
                request.notificationMessage()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("고정 규칙이 생성되었습니다.", RecurringRuleResponse.from(rule)));
    }

    @Operation(summary = "고정 규칙 목록 조회", description = "고정 지출/수익 규칙 목록을 조회합니다. active 파라미터로 활성/비활성 필터링 가능합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecurringRuleResponse>>> getRules(
            Authentication authentication,
            @RequestParam(required = false) Boolean active) {

        UUID userId = UUID.fromString(authentication.getName());
        List<RecurringRuleResponse> rules = recurringRuleUseCase.getList(userId, active).stream()
                .map(RecurringRuleResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @Operation(summary = "고정 규칙 상세 조회", description = "특정 고정 규칙의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> getRule(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        RecurringRule rule = recurringRuleUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(RecurringRuleResponse.from(rule)));
    }

    @Operation(summary = "고정 규칙 수정", description = "특정 고정 규칙의 정보를 부분 수정합니다. 수정하고 싶은 필드만 전송하면 됩니다.")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> updateRule(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRecurringRuleRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        RecurringRule rule = recurringRuleUseCase.update(
                userId,
                id,
                request.name(),
                request.title(),
                request.amount(),
                request.categoryId(),
                request.frequency(),
                request.dayOfMonth(),
                request.endDate(),
                request.notifyDaysBefore(),
                request.notificationMessage()
        );

        return ResponseEntity.ok(ApiResponse.success("고정 규칙이 수정되었습니다.", RecurringRuleResponse.from(rule)));
    }

    @Operation(summary = "고정 규칙 삭제", description = "특정 고정 규칙을 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        recurringRuleUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("고정 규칙이 삭제되었습니다.", null));
    }

    @Operation(summary = "고정 규칙 즉시 실행", description = "특정 고정 규칙을 즉시 실행하여 오늘 날짜로 거래 내역을 생성합니다. 스케줄러 대기 없이 수동으로 실행할 때 사용합니다.")
    @PostMapping("/{id}/execute")
    public ResponseEntity<ApiResponse<TransactionResponse>> executeNow(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = recurringRuleUseCase.executeNow(userId, id);
        return ResponseEntity.ok(ApiResponse.success("고정 규칙이 실행되었습니다.", TransactionResponse.from(transaction)));
    }

    @Operation(summary = "고정 규칙 일괄 실행", description = "여러 고정 규칙을 한 번에 실행하여 오늘 날짜로 거래 내역들을 생성합니다.")
    @PostMapping("/execute-batch")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> executeBatch(
            Authentication authentication,
            @Valid @RequestBody ExecuteBatchRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        List<TransactionResponse> transactions = recurringRuleUseCase.executeBatch(userId, request.ruleIds()).stream()
                .map(TransactionResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("고정 규칙들이 실행되었습니다.", transactions));
    }

    @Operation(summary = "고정 규칙 활성화/비활성화 토글", description = "특정 고정 규칙의 활성화 상태를 토글합니다. 비활성화된 규칙은 스케줄러가 실행하지 않습니다.")
    @PostMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<RecurringRuleResponse>> toggleRule(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        RecurringRule rule = recurringRuleUseCase.toggle(userId, id);
        String message = rule.active() ? "고정 규칙이 활성화되었습니다." : "고정 규칙이 비활성화되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message, RecurringRuleResponse.from(rule)));
    }
}
