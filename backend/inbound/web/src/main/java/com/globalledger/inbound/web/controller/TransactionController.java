package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.inbound.web.dto.request.CreateTransactionRequest;
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

@Tag(name = "거래 API")
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionPort transactionUseCase;

    @Operation(summary = "거래 생성", description = "새로운 거래를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = transactionUseCase.create(
                userId,
                request.accountId(),
                request.type(),
                request.amount(),
                request.currency(),
                request.categoryId(),
                request.tripId(),
                request.transactionDate(),
                request.note()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("거래가 생성되었습니다.", TransactionResponse.from(transaction)));
    }

    @Operation(summary = "거래 목록 조회", description = "조건에 따라 거래 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId) {

        UUID userId = UUID.fromString(authentication.getName());
        List<TransactionResponse> transactions = transactionUseCase
                .getList(userId, year, month, accountId, categoryId).stream()
                .map(TransactionResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @Operation(summary = "거래 상세 조회", description = "특정 거래의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = transactionUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.from(transaction)));
    }

    @Operation(summary = "거래 삭제", description = "특정 거래를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        transactionUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("거래가 삭제되었습니다.", null));
    }
}
