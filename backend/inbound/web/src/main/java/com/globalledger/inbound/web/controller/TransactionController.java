package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.inbound.web.dto.request.CreateTransactionRequest;
import com.globalledger.inbound.web.dto.response.TransactionResponse;
import com.globalledger.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionPort transactionUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateTransactionRequest request) {

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

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId) {

        List<TransactionResponse> transactions = transactionUseCase
                .getList(userId, year, month, accountId, categoryId).stream()
                .map(TransactionResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        Transaction transaction = transactionUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(TransactionResponse.from(transaction)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        transactionUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("거래가 삭제되었습니다.", null));
    }
}
